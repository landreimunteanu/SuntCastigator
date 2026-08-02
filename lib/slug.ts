import type { SupabaseClient } from "@supabase/supabase-js";

const COMBINING_DIACRITICS = new RegExp("[\\u0300-\\u036f]", "g");

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(COMBINING_DIACRITICS, "") // strip diacritics (ă, â, î, ș, ț, etc.)
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

// campaigns.slug is globally unique (not scoped per brand), so the
// uniqueness check must look across all brands, not just the caller's.
export async function ensureUniqueCampaignSlug(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>,
  baseSlug: string,
  excludeCampaignId?: string
): Promise<string> {
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    let query = supabase.from("campaigns").select("id").eq("slug", slug);
    if (excludeCampaignId) query = query.neq("id", excludeCampaignId);
    const { data: existing } = await query.maybeSingle();

    if (!existing) break;

    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}
