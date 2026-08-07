import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBrand } from "@/lib/supabase/get-brand";
import { serializeCsv, CSV_BOM } from "@/lib/csv/serialize";

export const dynamic = "force-dynamic";

type DrawRow = {
  id: string;
  seed: string;
  participant_count: number;
  participants_hash: string;
  ran_at: string;
  campaigns: { slug: string } | null;
};

type WinnerRow = {
  position: number;
  code_entries: { code: string; full_name: string; contact: string } | null;
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const brand = await getCurrentBrand();
  if (!brand) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  // RLS (draws_select) already scopes this to the caller's brand via the
  // parent campaign — an id from another brand returns null here.
  const { data: draw } = await supabase
    .from("draws")
    .select(
      "id, seed, participant_count, participants_hash, ran_at, campaigns ( slug )"
    )
    .eq("id", id)
    .maybeSingle<DrawRow>();

  if (!draw) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const { data: winners, error } = await supabase
    .from("winners")
    .select("position, code_entries ( code, full_name, contact )")
    .eq("draw_id", draw.id)
    .order("position", { ascending: true })
    .returns<WinnerRow[]>();

  if (error) {
    console.error("/api/draws/[id]/export failed", error);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }

  const commentRow =
    `# seed=${draw.seed} hash=${draw.participants_hash} ` +
    `participant_count=${draw.participant_count} ran_at=${draw.ran_at}\r\n`;

  const rows = (winners ?? []).map((w) => [
    String(w.position),
    w.code_entries?.code ?? "",
    w.code_entries?.full_name ?? "",
    w.code_entries?.contact ?? "",
  ]);

  const csv =
    CSV_BOM + commentRow + serializeCsv(["pozitie", "cod", "nume", "contact"], rows);

  const slug = draw.campaigns?.slug ?? "campanie";

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${slug}-castigatori.csv"`,
    },
  });
}
