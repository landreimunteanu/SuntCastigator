import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

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

// TESTING-ONLY escape hatch: auto-enrolls any first-time authenticated user
// into the oldest brand in the system, as 'editor'. This deliberately
// bypasses the MVP's "no self-signup, operator invites only" rule (see
// CLAUDE.md) so friends can be sent a magic link and land straight in the
// dashboard for informal testing, without per-email seeding. Remove before
// onboarding real brands — at that point membership must go back through
// scripts/seed-brand.ts exclusively.
async function autoEnrollInTestBrand(
  userId: string
): Promise<{ brand_id: string; role: BrandRole } | null> {
  const service = createServiceClient();

  const { data: brand } = await service
    .from("brands")
    .select("id")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!brand) return null;

  const { data: membership, error } = await service
    .from("brand_users")
    .insert({ brand_id: brand.id, user_id: userId, role: "editor" })
    .select("brand_id, role")
    .single();
  if (error || !membership) return null;

  return membership as { brand_id: string; role: BrandRole };
}

// Resolves the authenticated user's brand context. v1 policy: a user's first
// membership wins (by created_at) — brand-switching UI is out of scope for MVP.
// Returns null when there is no user OR no brand exists at all to enroll into.
export async function getCurrentBrand(): Promise<BrandContext | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  let membership = await supabase
    .from("brand_users")
    .select("brand_id, role")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle()
    .then((res) => res.data);

  if (!membership) {
    membership = await autoEnrollInTestBrand(user.id);
    if (!membership) return null;
  }

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
