"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentBrand } from "@/lib/supabase/get-brand";
import { slugify, ensureUniqueCampaignSlug } from "@/lib/slug";
import {
  campaignNameSchema,
  campaignDraftUpdateSchema,
  type CampaignNameInput,
  type CampaignDraftUpdate,
} from "@/lib/validations/campaign";

export async function createCampaignDraft(input: CampaignNameInput) {
  const validated = campaignNameSchema.parse(input);
  const brand = await getCurrentBrand();

  if (!brand) {
    throw new Error("No brand context");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const baseSlug = slugify(`${brand.brand.slug}-${validated.name}`);
  const slug = await ensureUniqueCampaignSlug(supabase, baseSlug);

  const { data: campaign, error } = await supabase
    .from("campaigns")
    .insert({
      brand_id: brand.brand.id,
      name: validated.name,
      slug,
      status: "draft",
      created_by: user.id,
    })
    .select(
      "id, name, slug, status, created_at, code_length, code_charset, single_use_codes, block_invalid_format, limit_per_contact_24h, starts_at, ends_at, rules_pdf_path"
    )
    .single();

  if (error) {
    console.error("createCampaignDraft failed:", error);
    throw new Error("Nu am putut crea campania.");
  }

  return campaign;
}

export async function updateCampaignDraft(
  campaignId: string,
  input: CampaignDraftUpdate
) {
  const validated = campaignDraftUpdateSchema.parse(input);
  const brand = await getCurrentBrand();

  if (!brand) {
    throw new Error("No brand context");
  }

  const supabase = await createClient();

  // Verify the campaign belongs to the user's brand
  const { data: campaign, error: fetchError } = await supabase
    .from("campaigns")
    .select("id, brand_id, status")
    .eq("id", campaignId)
    .single();

  if (fetchError || !campaign) {
    throw new Error("Campaign not found");
  }

  if (campaign.brand_id !== brand.brand.id) {
    throw new Error("Unauthorized");
  }

  if (campaign.status !== "draft") {
    throw new Error("Can only edit draft campaigns");
  }

  const updateData: Record<string, unknown> = {};

  if (validated.name !== undefined) {
    updateData.name = validated.name;
    const baseSlug = slugify(`${brand.brand.slug}-${validated.name}`);
    updateData.slug = await ensureUniqueCampaignSlug(
      supabase,
      baseSlug,
      campaignId
    );
  }

  if (validated.code_length !== undefined)
    updateData.code_length = validated.code_length;
  if (validated.code_charset !== undefined)
    updateData.code_charset = validated.code_charset;
  if (validated.code_regex !== undefined)
    updateData.code_regex = validated.code_regex;
  if (validated.single_use_codes !== undefined)
    updateData.single_use_codes = validated.single_use_codes;
  if (validated.block_invalid_format !== undefined)
    updateData.block_invalid_format = validated.block_invalid_format;
  if (validated.limit_per_contact_24h !== undefined)
    updateData.limit_per_contact_24h = validated.limit_per_contact_24h;
  if (validated.starts_at !== undefined) updateData.starts_at = validated.starts_at;
  if (validated.ends_at !== undefined) updateData.ends_at = validated.ends_at;
  if (validated.hero_image_url !== undefined)
    updateData.hero_image_url = validated.hero_image_url || null;
  if (validated.how_to_text !== undefined)
    updateData.how_to_text = validated.how_to_text;
  if (validated.rules_pdf_path !== undefined)
    updateData.rules_pdf_path = validated.rules_pdf_path;

  const { data: updated, error: updateError } = await supabase
    .from("campaigns")
    .update(updateData)
    .eq("id", campaignId)
    .select()
    .single();

  if (updateError) {
    console.error("updateCampaignDraft failed:", updateError);
    throw new Error("Nu am putut actualiza campania.");
  }

  return updated;
}
