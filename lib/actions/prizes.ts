"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentBrand } from "@/lib/supabase/get-brand";
import { prizeTierSchema, type PrizeTierInput } from "@/lib/validations/prize";
import { computePrizeTax } from "@/lib/prize-tax";

async function assertCampaignOwnership(campaignId: string) {
  const brand = await getCurrentBrand();
  if (!brand) throw new Error("No brand context");

  const supabase = await createClient();
  const { data: campaign } = await supabase
    .from("campaigns")
    .select("id, brand_id")
    .eq("id", campaignId)
    .single();

  if (!campaign || campaign.brand_id !== brand.brand.id) {
    throw new Error("Unauthorized");
  }

  return supabase;
}

export async function listPrizeTiers(campaignId: string) {
  const supabase = await assertCampaignOwnership(campaignId);

  const { data, error } = await supabase
    .from("prize_tiers")
    .select("id, name, quantity, value_lei, kind, taxable, sort_order")
    .eq("campaign_id", campaignId)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("listPrizeTiers failed:", error);
    throw new Error("Nu am putut încărca premiile.");
  }

  return data ?? [];
}

export async function createPrizeTier(
  campaignId: string,
  input: PrizeTierInput
) {
  const validated = prizeTierSchema.parse(input);
  const supabase = await assertCampaignOwnership(campaignId);
  const tax = await computePrizeTax(validated.value_lei);

  const { count } = await supabase
    .from("prize_tiers")
    .select("id", { count: "exact", head: true })
    .eq("campaign_id", campaignId);

  const { data, error } = await supabase
    .from("prize_tiers")
    .insert({
      campaign_id: campaignId,
      name: validated.name,
      quantity: validated.quantity,
      value_lei: validated.value_lei,
      kind: validated.kind,
      taxable: tax.taxable,
      sort_order: count ?? 0,
    })
    .select("id, name, quantity, value_lei, kind, taxable, sort_order")
    .single();

  if (error) {
    console.error("createPrizeTier failed:", error);
    throw new Error("Nu am putut crea premiul.");
  }

  return { tier: data, tax };
}

export async function updatePrizeTier(
  tierId: string,
  campaignId: string,
  input: PrizeTierInput
) {
  const validated = prizeTierSchema.parse(input);
  const supabase = await assertCampaignOwnership(campaignId);
  const tax = await computePrizeTax(validated.value_lei);

  const { data, error } = await supabase
    .from("prize_tiers")
    .update({
      name: validated.name,
      quantity: validated.quantity,
      value_lei: validated.value_lei,
      kind: validated.kind,
      taxable: tax.taxable,
    })
    .eq("id", tierId)
    .eq("campaign_id", campaignId)
    .select("id, name, quantity, value_lei, kind, taxable, sort_order")
    .single();

  if (error) {
    console.error("updatePrizeTier failed:", error);
    throw new Error("Nu am putut actualiza premiul.");
  }

  return { tier: data, tax };
}

export async function deletePrizeTier(tierId: string, campaignId: string) {
  const supabase = await assertCampaignOwnership(campaignId);

  const { error } = await supabase
    .from("prize_tiers")
    .delete()
    .eq("id", tierId)
    .eq("campaign_id", campaignId);

  if (error) {
    console.error("deletePrizeTier failed:", error);
    throw new Error("Nu am putut șterge premiul.");
  }

  return { ok: true };
}

export async function reorderPrizeTiers(
  campaignId: string,
  orderedIds: string[]
) {
  const supabase = await assertCampaignOwnership(campaignId);

  await Promise.all(
    orderedIds.map((id, index) =>
      supabase
        .from("prize_tiers")
        .update({ sort_order: index })
        .eq("id", id)
        .eq("campaign_id", campaignId)
    )
  );

  return { ok: true };
}
