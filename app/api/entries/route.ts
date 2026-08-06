import { NextRequest, NextResponse } from "next/server";
import { entrySubmissionSchema } from "@/lib/validations/entry";
import { submitEntry, type SubmitResult } from "@/lib/entries/submit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// The leftmost x-forwarded-for value is the original client on Vercel.
// Strip `:port` only from IPv4 addresses — a naive `:\d+$` strip mangles
// IPv6 loopback `::1` into `":"`, which Postgres INET rejects.
function stripIpv4Port(v: string): string {
  const m = v.match(/^(\d{1,3}(?:\.\d{1,3}){3}):\d+$/);
  return m ? m[1] : v;
}

function getClientIp(req: NextRequest): string | null {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return stripIpv4Port(first);
  }
  const real = req.headers.get("x-real-ip");
  return real ? stripIpv4Port(real.trim()) : null;
}

function json(payload: unknown, status: number) {
  return NextResponse.json(payload, { status });
}

function respond(result: SubmitResult) {
  switch (result.kind) {
    case "valid":
      return json({ status: "valid" }, 201);
    case "duplicate":
      return json({ status: "duplicate" }, 409);
    case "invalid_format":
      return json({ status: "invalid" }, 400);
    case "rate_limited":
      return json({ error: "rate_limited", reason: result.reason }, 429);
    case "campaign_ended":
      return json({ error: "campaign_ended" }, 400);
    case "campaign_not_started":
      return json({ error: "campaign_not_started" }, 400);
    case "campaign_not_active":
      return json({ error: "campaign_not_active" }, 400);
    case "campaign_not_found":
      return json({ error: "campaign_not_found" }, 404);
    case "error":
      return json({ error: "internal" }, 500);
  }
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json({ error: "invalid_input" }, 400);
  }

  const parsed = entrySubmissionSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    if (first?.path?.[0] === "gdprConsent") {
      return json({ error: "gdpr_required" }, 400);
    }
    return json({ error: "invalid_input" }, 400);
  }

  const ip = getClientIp(req);

  try {
    const result = await submitEntry({
      campaignId: parsed.data.campaignId,
      code: parsed.data.code.toUpperCase(),
      fullName: parsed.data.fullName,
      contact: parsed.data.contact,
      gdprConsent: parsed.data.gdprConsent,
      ip,
    });
    return respond(result);
  } catch (err) {
    console.error("/api/entries failed", err);
    return json({ error: "internal" }, 500);
  }
}
