import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBrand } from "@/lib/supabase/get-brand";
import { getCampaignForBrand } from "@/lib/queries/campaign-detail";
import { serializeCsv, CSV_BOM } from "@/lib/csv/serialize";

export const dynamic = "force-dynamic";

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

  const campaign = await getCampaignForBrand(id, brand.brand.id);
  if (!campaign) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const { data: entries, error } = await supabase
    .from("code_entries")
    .select("code, full_name, contact, created_at")
    .eq("campaign_id", campaign.id)
    .eq("status", "valid")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("/api/campaigns/[id]/export failed", error);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }

  const rows = (entries ?? []).map((e) => [
    e.code,
    e.full_name,
    e.contact,
    new Date(e.created_at).toLocaleString("ro-RO"),
  ]);

  const csv = CSV_BOM + serializeCsv(["cod", "nume", "contact", "data"], rows);

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${campaign.slug}-inscrieri.csv"`,
    },
  });
}
