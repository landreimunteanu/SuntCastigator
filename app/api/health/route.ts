import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createClient();
    // Round-trips to Supabase Auth (GoTrue) — proves connectivity + valid keys
    // without depending on any tables (schema lands in T0.4).
    const { error } = await supabase.auth.getSession();
    if (error) {
      // Unauthenticated, public endpoint — never echo the underlying
      // Supabase/GoTrue error text back to the caller.
      console.error("/api/health failed", error);
      return NextResponse.json({ ok: false }, { status: 503 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("/api/health failed", err);
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}
