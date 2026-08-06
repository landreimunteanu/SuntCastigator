import Link from "next/link";

type CampaignStatus = "draft" | "active" | "ended";

export type CampaignListItem = {
  id: string;
  name: string;
  slug: string;
  status: CampaignStatus;
  starts_at: string | null;
  ends_at: string | null;
  entryCount: number;
};

const STATUS_LABELS: Record<CampaignStatus, string> = {
  draft: "Ciornă",
  active: "Activă",
  ended: "Încheiată",
};

const STATUS_STYLES: Record<CampaignStatus, string> = {
  draft: "bg-neutral-100 text-neutral-700",
  active: "bg-emerald-100 text-emerald-700",
  ended: "bg-neutral-200 text-neutral-600",
};

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("ro-RO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function CampaignCard({ campaign }: { campaign: CampaignListItem }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white p-5">
      <div className="min-w-0">
        <div className="flex items-center gap-3">
          <h3 className="truncate text-base font-semibold text-neutral-900">
            {campaign.name}
          </h3>
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[campaign.status]}`}
          >
            {STATUS_LABELS[campaign.status]}
          </span>
        </div>
        <p className="mt-1 text-sm text-neutral-600">
          {formatDate(campaign.starts_at)} – {formatDate(campaign.ends_at)}
          <span className="mx-2 text-neutral-300">·</span>
          {campaign.entryCount} înscrieri
        </p>
      </div>

      <div className="ml-4 shrink-0">
        {campaign.status === "draft" && (
          <Link
            href={`/dashboard/campaigns/new?id=${campaign.id}`}
            className="inline-flex items-center justify-center rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-800 shadow-sm transition-colors hover:bg-neutral-50"
          >
            Continuă configurarea
          </Link>
        )}
        {campaign.status === "active" && (
          <div className="flex items-center gap-2">
            <Link
              href={`/dashboard/campaigns/${campaign.id}`}
              className="inline-flex items-center justify-center rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-800 shadow-sm transition-colors hover:bg-neutral-50"
            >
              Vezi detalii
            </Link>
            <Link
              href={`/c/${campaign.slug}`}
              target="_blank"
              className="inline-flex items-center justify-center rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-800 shadow-sm transition-colors hover:bg-neutral-50"
            >
              Vezi pagina publică
            </Link>
          </div>
        )}
        {campaign.status === "ended" && (
          <Link
            href={`/dashboard/campaigns/${campaign.id}`}
            className="inline-flex items-center justify-center rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-800 shadow-sm transition-colors hover:bg-neutral-50"
          >
            Vezi detalii
          </Link>
        )}
      </div>
    </div>
  );
}
