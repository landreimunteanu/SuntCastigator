"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentBrand } from "@/lib/supabase/get-brand";
import { productRowSchema } from "@/lib/validations/product";
import { parseProductsCsv, type CsvParseError } from "@/lib/csv/parse";

export async function importProductsCsv(csvContent: string) {
  const brand = await getCurrentBrand();
  if (!brand) throw new Error("No brand context");

  const { rows, errors: parseErrors } = parseProductsCsv(csvContent);

  const validRows: { sku: string; name: string }[] = [];
  const errors: CsvParseError[] = [...parseErrors];

  for (let i = 0; i < rows.length; i++) {
    const result = productRowSchema.safeParse(rows[i]);
    if (result.success) {
      validRows.push(result.data);
    } else {
      errors.push({
        row: i + 2, // +1 header, +1 for 1-indexing
        reason: result.error.issues[0]?.message ?? "Rând invalid",
      });
    }
  }

  if (validRows.length === 0) {
    return { imported: 0, errors };
  }

  const supabase = await createClient();
  const { error, data } = await supabase
    .from("products")
    .upsert(
      validRows.map((row) => ({
        brand_id: brand.brand.id,
        sku: row.sku,
        name: row.name,
      })),
      { onConflict: "brand_id,sku" }
    )
    .select("id");

  if (error) {
    throw new Error(`Failed to import products: ${error.message}`);
  }

  return { imported: data?.length ?? 0, errors };
}

export async function searchProducts(query: string) {
  const brand = await getCurrentBrand();
  if (!brand) throw new Error("No brand context");

  const supabase = await createClient();
  let request = supabase
    .from("products")
    .select("id, sku, name")
    .eq("brand_id", brand.brand.id)
    .order("name", { ascending: true });

  if (query.trim()) {
    request = request.or(`name.ilike.%${query}%,sku.ilike.%${query}%`);
  }

  const { data, error } = await request;
  if (error) throw new Error(`Failed to search products: ${error.message}`);

  return data ?? [];
}

export async function getSelectedProductIds(campaignId: string) {
  const brand = await getCurrentBrand();
  if (!brand) throw new Error("No brand context");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("campaign_products")
    .select("product_id")
    .eq("campaign_id", campaignId);

  if (error) throw new Error(`Failed to load selection: ${error.message}`);

  return (data ?? []).map((row) => row.product_id as string);
}

export async function toggleCampaignProduct(
  campaignId: string,
  productId: string,
  selected: boolean
) {
  const brand = await getCurrentBrand();
  if (!brand) throw new Error("No brand context");

  const supabase = await createClient();

  if (selected) {
    const { error } = await supabase
      .from("campaign_products")
      .upsert(
        { campaign_id: campaignId, product_id: productId },
        { onConflict: "campaign_id,product_id" }
      );
    if (error) throw new Error(`Failed to select product: ${error.message}`);
  } else {
    const { error } = await supabase
      .from("campaign_products")
      .delete()
      .eq("campaign_id", campaignId)
      .eq("product_id", productId);
    if (error) throw new Error(`Failed to deselect product: ${error.message}`);
  }

  return { ok: true };
}
