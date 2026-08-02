"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentBrand } from "@/lib/supabase/get-brand";

export type LaunchCheckResult = {
  ok: boolean;
  errors: string[];
  slug?: string;
};

export async function launchCampaign(
  campaignId: string
): Promise<LaunchCheckResult> {
  const brand = await getCurrentBrand();
  if (!brand) throw new Error("No brand context");

  const supabase = await createClient();

  const { data: campaign, error: fetchError } = await supabase
    .from("campaigns")
    .select(
      "id, brand_id, status, slug, code_regex, starts_at, ends_at, rules_pdf_path"
    )
    .eq("id", campaignId)
    .single();

  if (fetchError || !campaign) throw new Error("Campaign not found");
  if (campaign.brand_id !== brand.brand.id) throw new Error("Unauthorized");

  const errors: string[] = [];

  const { count: productCount } = await supabase
    .from("campaign_products")
    .select("product_id", { count: "exact", head: true })
    .eq("campaign_id", campaignId);
  if (!productCount || productCount < 1) {
    errors.push("Selectează cel puțin un produs eligibil (Pasul 1)");
  }

  if (!campaign.code_regex) {
    errors.push("Configurează formatul codului (Pasul 2)");
  }

  const { count: tierCount } = await supabase
    .from("prize_tiers")
    .select("id", { count: "exact", head: true })
    .eq("campaign_id", campaignId);
  if (!tierCount || tierCount < 1) {
    errors.push("Adaugă cel puțin un premiu (Pasul 3)");
  }

  if (!campaign.starts_at || !campaign.ends_at) {
    errors.push("Setează datele de început și sfârșit (Pasul 4)");
  } else if (campaign.starts_at > campaign.ends_at) {
    errors.push("Data de sfârșit trebuie să fie după data de început (Pasul 4)");
  }

  if (!campaign.rules_pdf_path) {
    errors.push("Încarcă regulamentul campaniei (Pasul 4)");
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const { error: updateError } = await supabase
    .from("campaigns")
    .update({ status: "active" })
    .eq("id", campaignId);

  if (updateError) {
    throw new Error(`Failed to launch campaign: ${updateError.message}`);
  }

  return { ok: true, errors: [], slug: campaign.slug };
}
