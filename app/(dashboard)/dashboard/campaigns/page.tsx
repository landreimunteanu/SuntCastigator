import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBrand } from "@/lib/supabase/get-brand";
import { CampaignCard, type CampaignListItem } from "@/components/CampaignCard";

export const dynamic = "force-dynamic";

export default async function CampaignsPage() {
  const brand = await getCurrentBrand();
  if (!brand) return null; // layout already renders the "no brand" message

  const supabase = await createClient();

  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("id, name, slug, status, starts_at, ends_at")
    .eq("brand_id", brand.brand.id)
    .order("created_at", { ascending: false });

  const items: CampaignListItem[] = await Promise.all(
    (campaigns ?? []).map(async (campaign) => {
      const { count } = await supabase
        .from("code_entries")
        .select("id", { count: "exact", head: true })
        .eq("campaign_id", campaign.id)
        .eq("status", "valid");

      return { ...campaign, entryCount: count ?? 0 };
    })
  );

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-neutral-900">Campanii</h1>
        <Link
          href="/dashboard/campaigns/new"
          className="inline-flex items-center justify-center rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-neutral-800"
        >
          + Campanie nouă
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-neutral-300 bg-neutral-50 p-12 text-center">
          <p className="text-sm text-neutral-600">
            Nu ai nicio campanie încă. Creează prima campanie pentru a începe
            să colectezi înscrieri.
          </p>
          <Link
            href="/dashboard/campaigns/new"
            className="mt-4 inline-flex items-center justify-center rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-neutral-800"
          >
            + Campanie nouă
          </Link>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {items.map((campaign) => (
            <CampaignCard key={campaign.id} campaign={campaign} />
          ))}
        </div>
      )}
    </div>
  );
}
