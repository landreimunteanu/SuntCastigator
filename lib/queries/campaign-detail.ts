import { createClient } from "@/lib/supabase/server";

export type CampaignDetail = {
  id: string;
  brand_id: string;
  name: string;
  slug: string;
  status: "draft" | "active" | "ended";
  starts_at: string | null;
  ends_at: string | null;
};

// Scoped to the caller's brand via RLS (is_brand_member) AND an explicit
// brand_id filter, so a campaign id from another brand returns null either
// way — the caller turns that into notFound().
export async function getCampaignForBrand(
  campaignId: string,
  brandId: string
): Promise<CampaignDetail | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("campaigns")
    .select("id, brand_id, name, slug, status, starts_at, ends_at")
    .eq("id", campaignId)
    .eq("brand_id", brandId)
    .maybeSingle();

  return data;
}
