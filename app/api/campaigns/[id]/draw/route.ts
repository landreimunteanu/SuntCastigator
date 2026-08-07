import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireRole, ForbiddenError, UnauthorizedError } from "@/lib/auth/roles";
import { getCampaignForBrand } from "@/lib/queries/campaign-detail";
import { runDraw } from "@/lib/draw/engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({ prizeTierId: z.string().uuid() });

function errorStatus(error: string): number {
  switch (error) {
    case "not_found":
      return 404;
    case "already_drawn":
      return 409;
    default:
      return 400;
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let brand;
  try {
    brand = await requireRole("owner");
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
    }
    if (err instanceof ForbiddenError) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    throw err;
  }

  const campaign = await getCampaignForBrand(id, brand.brand.id);
  if (!campaign) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  try {
    const result = await runDraw(campaign.id, parsed.data.prizeTierId, user.id);
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error },
        { status: errorStatus(result.error) }
      );
    }
    return NextResponse.json(
      {
        drawId: result.drawId,
        seed: result.seed,
        participantCount: result.participantCount,
        winnerCount: result.winnerEntryIds.length,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("/api/campaigns/[id]/draw failed", err);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
