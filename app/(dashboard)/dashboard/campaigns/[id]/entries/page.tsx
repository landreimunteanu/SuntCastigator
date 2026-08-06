import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBrand } from "@/lib/supabase/get-brand";
import { getCampaignForBrand } from "@/lib/queries/campaign-detail";
import { EntriesTable, type EntryRow, type EntryStatus } from "@/components/EntriesTable";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;
const VALID_STATUSES: EntryStatus[] = ["valid", "duplicate", "invalid"];

function parseStatus(raw: string | undefined): EntryStatus | "all" {
  if (raw && VALID_STATUSES.includes(raw as EntryStatus)) {
    return raw as EntryStatus;
  }
  return "all";
}

function parsePage(raw: string | undefined): number {
  const n = raw ? parseInt(raw, 10) : 1;
  return Number.isFinite(n) && n > 0 ? n : 1;
}

export default async function CampaignEntriesPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;

  const brand = await getCurrentBrand();
  if (!brand) return null;

  const campaign = await getCampaignForBrand(id, brand.brand.id);
  if (!campaign) notFound();

  const statusFilter = parseStatus(query.status);
  const page = parsePage(query.page);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = await createClient();
  let entriesQuery = supabase
    .from("code_entries")
    .select("id, code, full_name, contact, status, created_at", {
      count: "exact",
    })
    .eq("campaign_id", campaign.id)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (statusFilter !== "all") {
    entriesQuery = entriesQuery.eq("status", statusFilter);
  }

  const { data, count } = await entriesQuery;

  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-neutral-500">
        <Link
          href={`/dashboard/campaigns/${campaign.id}`}
          className="hover:text-neutral-900 hover:underline"
        >
          {campaign.name}
        </Link>
        <span>/</span>
        <span className="text-neutral-900">Înscrieri</span>
      </div>
      <h1 className="mt-1 text-2xl font-semibold text-neutral-900">
        Înscrieri — {campaign.name}
      </h1>

      <div className="mt-6">
        <EntriesTable
          campaignId={campaign.id}
          entries={(data ?? []) as EntryRow[]}
          page={page}
          pageSize={PAGE_SIZE}
          totalCount={count ?? 0}
          statusFilter={statusFilter}
        />
      </div>
    </div>
  );
}
