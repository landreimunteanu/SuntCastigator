import { createServiceClient } from "@/lib/supabase/service";

// Anon has zero access to `campaigns` (RLS denies). The consumer page reaches
// the DB through the service-role client and returns ONLY the fields safe to
// expose publicly — never brand internals, never entry lists, never anything
// beyond what the mockup renders.

export type CampaignState =
  | "active"
  | "not_started"
  | "ended"
  | "draft";

export type PublicCampaign = {
  id: string;
  name: string;
  slug: string;
  startsAt: string | null;
  endsAt: string | null;
  codeRegex: string | null;
  singleUseCodes: boolean;
  heroImageUrl: string | null;
  howToText: string | null;
  rulesPdfUrl: string | null;
  state: CampaignState;
  brand: { name: string; logoUrl: string | null };
};

type CampaignRow = {
  id: string;
  name: string;
  slug: string;
  status: "draft" | "active" | "ended";
  starts_at: string | null;
  ends_at: string | null;
  code_regex: string | null;
  single_use_codes: boolean;
  hero_image_url: string | null;
  how_to_text: string | null;
  rules_pdf_path: string | null;
  brands: { name: string; logo_url: string | null } | null;
};

function computeState(row: CampaignRow): CampaignState {
  if (row.status === "draft") return "draft";
  if (row.status === "ended") return "ended";
  const today = new Date().toISOString().slice(0, 10);
  if (row.starts_at && today < row.starts_at) return "not_started";
  if (row.ends_at && today > row.ends_at) return "ended";
  return "active";
}

export async function getPublicCampaign(
  slug: string
): Promise<PublicCampaign | null> {
  const service = createServiceClient();

  const { data, error } = await service
    .from("campaigns")
    .select(
      "id, name, slug, status, starts_at, ends_at, code_regex, single_use_codes, hero_image_url, how_to_text, rules_pdf_path, brands ( name, logo_url )"
    )
    .eq("slug", slug)
    .maybeSingle<CampaignRow>();

  // Drafts are pre-launch and unannounced — a brand's own name, hero image,
  // "how to enter" copy and regulament PDF must not be reachable by anyone
  // who guesses/scrapes the slug before the brand is ready. 404 identically
  // to a nonexistent slug rather than a distinct "not live yet" state, so
  // guessing a slug can't even confirm a draft campaign exists.
  if (error || !data || data.status === "draft") return null;

  let rulesPdfUrl: string | null = null;
  if (data.rules_pdf_path) {
    const { data: pub } = service.storage
      .from("regulamente")
      .getPublicUrl(data.rules_pdf_path);
    rulesPdfUrl = pub.publicUrl;
  }

  return {
    id: data.id,
    name: data.name,
    slug: data.slug,
    startsAt: data.starts_at,
    endsAt: data.ends_at,
    codeRegex: data.code_regex,
    singleUseCodes: data.single_use_codes,
    heroImageUrl: data.hero_image_url,
    howToText: data.how_to_text,
    rulesPdfUrl,
    state: computeState(data),
    brand: {
      name: data.brands?.name ?? "",
      logoUrl: data.brands?.logo_url ?? null,
    },
  };
}
