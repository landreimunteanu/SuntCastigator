import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

// Pinged on a schedule (see .github/workflows/keepalive.yml) to keep the
// free-tier Supabase project's Postgres compute from auto-pausing after a
// week of no activity. A real query (not just an auth/session check) is
// required — the pause detector tracks database activity specifically.
export async function GET() {
  try {
    const supabase = createServiceClient();
    const { error } = await supabase.from("settings").select("key").limit(1);
    if (error) {
      console.error("/api/keepalive failed", error);
      return NextResponse.json({ ok: false }, { status: 503 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("/api/keepalive failed", err);
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}
