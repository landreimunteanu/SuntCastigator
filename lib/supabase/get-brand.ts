import { createClient } from "@/lib/supabase/server";

export type BrandRole = "owner" | "editor";

export type BrandContext = {
  brand: {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
  };
  role: BrandRole;
};

// Resolves the authenticated user's brand context. v1 policy: a user's first
// membership wins (by created_at) — brand-switching UI is out of scope for MVP.
// Returns null when there is no user, or the user is authenticated but has
// no membership (see CLAUDE.md: no self-signup — membership is granted
// exclusively via scripts/seed-brand.mjs). The dashboard layout renders a
// "no brand" screen for that case rather than enrolling the user anywhere.
export async function getCurrentBrand(): Promise<BrandContext | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const membership = await supabase
    .from("brand_users")
    .select("brand_id, role")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle()
    .then((res) => res.data);

  if (!membership) return null;

  const { data: brand } = await supabase
    .from("brands")
    .select("id, name, slug, logo_url")
    .eq("id", membership.brand_id)
    .single();

  if (!brand) return null;

  return {
    brand,
    role: membership.role as BrandRole,
  };
}
