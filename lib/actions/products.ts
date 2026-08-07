"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentBrand } from "@/lib/supabase/get-brand";
import { productRowSchema } from "@/lib/validations/product";
import { parseProductsCsv, type CsvParseError } from "@/lib/csv/parse";

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

  return { supabase, brandId: brand.brand.id };
}

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
    console.error("importProductsCsv failed:", error);
    throw new Error("Nu am putut importa produsele.");
  }

  return { imported: data?.length ?? 0, errors };
}

// PostgREST's .or() filter DSL treats `,`, `(`, `)`, and `.` as syntax —
// strip them from user input so a search term can't break out of the
// intended name/sku filter or trigger a parser error.
function escapePostgrestFilterValue(value: string) {
  return value.replace(/[,().]/g, "");
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

  const safeQuery = escapePostgrestFilterValue(query.trim());
  if (safeQuery) {
    request = request.or(`name.ilike.%${safeQuery}%,sku.ilike.%${safeQuery}%`);
  }

  const { data, error } = await request;
  if (error) {
    console.error("searchProducts failed:", error);
    throw new Error("Nu am putut căuta produsele.");
  }

  return data ?? [];
}

export async function getSelectedProductIds(campaignId: string) {
  const { supabase } = await assertCampaignOwnership(campaignId);

  const { data, error } = await supabase
    .from("campaign_products")
    .select("product_id")
    .eq("campaign_id", campaignId);

  if (error) {
    console.error("getSelectedProductIds failed:", error);
    throw new Error("Nu am putut încărca selecția de produse.");
  }

  return (data ?? []).map((row) => row.product_id as string);
}

export async function toggleCampaignProduct(
  campaignId: string,
  productId: string,
  selected: boolean
) {
  const { supabase, brandId } = await assertCampaignOwnership(campaignId);

  if (selected) {
    // Defense in depth: the campaign_products_insert RLS policy already
    // enforces this at the DB level, but check here too so a foreign
    // product id fails fast with a clear reason instead of a raw
    // Postgres RLS-violation error reaching the client.
    const { data: product } = await supabase
      .from("products")
      .select("id")
      .eq("id", productId)
      .eq("brand_id", brandId)
      .maybeSingle();

    if (!product) {
      throw new Error("Produs invalid.");
    }

    const { error } = await supabase
      .from("campaign_products")
      .upsert(
        { campaign_id: campaignId, product_id: productId },
        { onConflict: "campaign_id,product_id" }
      );
    if (error) {
      console.error("toggleCampaignProduct (select) failed:", error);
      throw new Error("Nu am putut selecta produsul.");
    }
  } else {
    const { error } = await supabase
      .from("campaign_products")
      .delete()
      .eq("campaign_id", campaignId)
      .eq("product_id", productId);
    if (error) {
      console.error("toggleCampaignProduct (deselect) failed:", error);
      throw new Error("Nu am putut anula selecția produsului.");
    }
  }

  return { ok: true };
}
