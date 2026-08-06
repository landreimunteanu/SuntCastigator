import Link from "next/link";

export type EntryStatus = "valid" | "duplicate" | "invalid";

export type EntryRow = {
  id: string;
  code: string;
  full_name: string;
  contact: string;
  status: EntryStatus;
  created_at: string;
};

type StatusFilter = EntryStatus | "all";

type Props = {
  campaignId: string;
  entries: EntryRow[];
  page: number;
  pageSize: number;
  totalCount: number;
  statusFilter: StatusFilter;
};

const STATUS_LABELS: Record<EntryStatus, string> = {
  valid: "Valid",
  duplicate: "Duplicat",
  invalid: "Invalid",
};

const STATUS_STYLES: Record<EntryStatus, string> = {
  valid: "bg-emerald-100 text-emerald-700",
  duplicate: "bg-amber-100 text-amber-700",
  invalid: "bg-red-100 text-red-700",
};

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Toate" },
  { value: "valid", label: "Valide" },
  { value: "duplicate", label: "Duplicate" },
  { value: "invalid", label: "Invalide" },
];

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("ro-RO", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function buildHref(campaignId: string, status: StatusFilter, page: number) {
  const params = new URLSearchParams();
  if (status !== "all") params.set("status", status);
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return `/dashboard/campaigns/${campaignId}/entries${qs ? `?${qs}` : ""}`;
}

export function EntriesTable({
  campaignId,
  entries,
  page,
  pageSize,
  totalCount,
  statusFilter,
}: Props) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.value}
            href={buildHref(campaignId, f.value, 1)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              statusFilter === f.value
                ? "bg-neutral-900 text-white"
                : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-neutral-200 bg-white">
        {entries.length === 0 ? (
          <p className="p-8 text-center text-sm text-neutral-600">
            Nicio înscriere{statusFilter !== "all" ? " pentru acest filtru" : ""}.
          </p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase tracking-wider text-neutral-500">
              <tr>
                <th className="px-4 py-2.5 font-medium">Cod</th>
                <th className="px-4 py-2.5 font-medium">Participant</th>
                <th className="px-4 py-2.5 font-medium">Dată</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {entries.map((entry) => (
                <tr key={entry.id}>
                  <td className="px-4 py-2.5 font-mono text-xs tracking-wider text-neutral-900">
                    {entry.code}
                  </td>
                  <td className="px-4 py-2.5 text-neutral-800">
                    <div>{entry.full_name}</div>
                    <div className="text-xs text-neutral-500">
                      {entry.contact}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-neutral-600">
                    {formatDateTime(entry.created_at)}
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[entry.status]}`}
                    >
                      {STATUS_LABELS[entry.status]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <Link
            href={buildHref(campaignId, statusFilter, Math.max(1, page - 1))}
            aria-disabled={page <= 1}
            className={`rounded-md border border-neutral-300 px-3 py-1.5 ${
              page <= 1
                ? "pointer-events-none opacity-40"
                : "hover:bg-neutral-50"
            }`}
          >
            ← Anterior
          </Link>
          <span className="text-neutral-600">
            Pagina {page} din {totalPages}
          </span>
          <Link
            href={buildHref(
              campaignId,
              statusFilter,
              Math.min(totalPages, page + 1)
            )}
            aria-disabled={page >= totalPages}
            className={`rounded-md border border-neutral-300 px-3 py-1.5 ${
              page >= totalPages
                ? "pointer-events-none opacity-40"
                : "hover:bg-neutral-50"
            }`}
          >
            Următor →
          </Link>
        </div>
      )}
    </div>
  );
}
