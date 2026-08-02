"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getCurrentBrand } from "@/lib/supabase/get-brand";

const MAX_SIZE_BYTES = 10 * 1024 * 1024;

export async function uploadRulesPdf(campaignId: string, file: File) {
  if (file.type !== "application/pdf") {
    throw new Error("Doar fișiere PDF sunt acceptate");
  }
  if (file.size > MAX_SIZE_BYTES) {
    throw new Error("Fișierul depășește limita de 10 MB");
  }

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

  const path = `${brand.brand.id}/${campaignId}/regulament.pdf`;

  // Storage writes require the service-role client — the bucket is
  // public-read but has no INSERT policy for authenticated users, so
  // uploads happen exclusively server-side (see lib/supabase/service.ts).
  const service = createServiceClient();
  const { error: uploadError } = await service.storage
    .from("regulamente")
    .upload(path, file, { contentType: "application/pdf", upsert: true });

  if (uploadError) {
    throw new Error(`Failed to upload PDF: ${uploadError.message}`);
  }

  const { error: updateError } = await supabase
    .from("campaigns")
    .update({ rules_pdf_path: path })
    .eq("id", campaignId);

  if (updateError) {
    throw new Error(`Failed to save PDF path: ${updateError.message}`);
  }

  const { data: publicUrl } = service.storage
    .from("regulamente")
    .getPublicUrl(path);

  return { path, url: publicUrl.publicUrl };
}
