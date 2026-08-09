import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBrand } from "@/lib/supabase/get-brand";
import { getCampaignForBrand } from "@/lib/queries/campaign-detail";
import { getEntriesByDay } from "@/lib/queries/entries-by-day";
import { StatCard } from "@/components/StatCard";
import { EntriesChart } from "@/components/EntriesChart";
import { CopyLinkButton } from "@/components/CopyLinkButton";
import { AutoRefresh } from "@/components/AutoRefresh";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, string> = {
  draft: "Ciornă",
  active: "Activă",
  ended: "Încheiată",
};

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-neutral-100 text-neutral-700",
  active: "bg-emerald-100 text-emerald-700",
  ended: "bg-neutral-200 text-neutral-600",
};

function daysLeftLabel(
  status: string,
  endsAt: string | null
): string {
  if (status === "ended") return "Încheiată";
  if (status === "draft" || !endsAt) return "—";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(endsAt);
  const days = Math.ceil((end.getTime() - today.getTime()) / 86_400_000);
  return String(Math.max(0, days));
}

export default async function CampaignOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const brand = await getCurrentBrand();
  if (!brand) return null;

  const campaign = await getCampaignForBrand(id, brand.brand.id);
  if (!campaign) notFound();

  const supabase = await createClient();

  const [totalRes, validRes, rejectedRes, dayCounts] = await Promise.all([
    supabase
      .from("code_entries")
      .select("id", { count: "exact", head: true })
      .eq("campaign_id", campaign.id),
    supabase
      .from("code_entries")
      .select("id", { count: "exact", head: true })
      .eq("campaign_id", campaign.id)
      .eq("status", "valid"),
    supabase
      .from("code_entries")
      .select("id", { count: "exact", head: true })
      .eq("campaign_id", campaign.id)
      .in("status", ["duplicate", "invalid"]),
    getEntriesByDay(campaign.id),
  ]);

  return (
    <div>
      {campaign.status === "active" && <AutoRefresh />}
      <div className="flex items-center gap-2 text-sm text-neutral-500">
        <Link
          href="/dashboard/campaigns"
          className="hover:text-neutral-900 hover:underline"
        >
          Campanii
        </Link>
        <span>/</span>
        <span className="text-neutral-900">{campaign.name}</span>
      </div>

      <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-neutral-900">
            {campaign.name}
          </h1>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[campaign.status]}`}
          >
            {STATUS_LABELS[campaign.status]}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {campaign.status === "active" && (
            <>
              <Link
                href={`/c/${campaign.slug}`}
                target="_blank"
                className="inline-flex items-center justify-center rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-800 shadow-sm transition-colors hover:bg-neutral-50"
              >
                Vezi pagina publică
              </Link>
              <CopyLinkButton path={`/c/${campaign.slug}`} />
            </>
          )}
          <a
            href={`/api/campaigns/${campaign.id}/export`}
            className="inline-flex items-center justify-center rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-neutral-800"
          >
            Exportă CSV
          </a>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Înscrieri totale" value={totalRes.count ?? 0} />
        <StatCard
          label="Coduri valide"
          value={validRes.count ?? 0}
          tone="positive"
        />
        <StatCard
          label="Respinse"
          value={rejectedRes.count ?? 0}
          tone="negative"
        />
        <StatCard
          label="Zile rămase"
          value={daysLeftLabel(campaign.status, campaign.ends_at)}
        />
      </div>

      <div className="mt-6">
        <h2 className="mb-2 text-sm font-semibold text-neutral-900">
          Înscrieri în timp
        </h2>
        <EntriesChart data={dayCounts} />
      </div>

      <div className="mt-6 flex items-center gap-3">
        <Link
          href={`/dashboard/campaigns/${campaign.id}/entries`}
          className="inline-flex items-center justify-center rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-800 shadow-sm transition-colors hover:bg-neutral-50"
        >
          Vezi toate înscrierile →
        </Link>
        <Link
          href={`/dashboard/campaigns/${campaign.id}/draw`}
          className="inline-flex items-center justify-center rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-800 shadow-sm transition-colors hover:bg-neutral-50"
        >
          🎲 Extragere câștigători
        </Link>
      </div>
    </div>
  );
}
