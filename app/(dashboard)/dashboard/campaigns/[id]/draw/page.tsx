import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getCurrentBrand } from "@/lib/supabase/get-brand";
import { getCampaignForBrand } from "@/lib/queries/campaign-detail";
import { DrawPanel, type ExistingDraw } from "@/components/DrawPanel";

export const dynamic = "force-dynamic";

type WinnerJoinRow = {
  draw_id: string;
  position: number;
  code_entries: { code: string; full_name: string; contact: string } | null;
};

export default async function CampaignDrawPage({
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

  const [{ data: tiers }, { data: draws }, { count: eligibleCount }] =
    await Promise.all([
      supabase
        .from("prize_tiers")
        .select("id, name, quantity, value_lei, kind, sort_order")
        .eq("campaign_id", campaign.id)
        .order("sort_order", { ascending: true }),
      supabase
        .from("draws")
        .select("id, prize_tier_id, seed, participant_count, participants_hash, ran_at, ran_by")
        .eq("campaign_id", campaign.id),
      supabase
        .from("code_entries")
        .select("id", { count: "exact", head: true })
        .eq("campaign_id", campaign.id)
        .eq("status", "valid"),
    ]);

  const drawIds = (draws ?? []).map((d) => d.id);

  const { data: winnerRows } = drawIds.length
    ? await supabase
        .from("winners")
        .select("draw_id, position, code_entries ( code, full_name, contact )")
        .in("draw_id", drawIds)
        .order("position", { ascending: true })
        .returns<WinnerJoinRow[]>()
    : { data: [] as WinnerJoinRow[] };

  // ran_by resolves to auth.users, which PostgREST doesn't expose — the
  // admin API needs the service-role client for this read-only lookup.
  const uniqueRanBy = Array.from(new Set((draws ?? []).map((d) => d.ran_by)));
  const service = createServiceClient();
  const emailByUserId = new Map<string, string>();
  await Promise.all(
    uniqueRanBy.map(async (userId) => {
      const { data } = await service.auth.admin.getUserById(userId);
      if (data.user?.email) emailByUserId.set(userId, data.user.email);
    })
  );

  const drawByTierId = new Map<string, ExistingDraw>();
  for (const draw of draws ?? []) {
    drawByTierId.set(draw.prize_tier_id, {
      id: draw.id,
      seed: draw.seed,
      participantCount: draw.participant_count,
      participantsHash: draw.participants_hash,
      ranAt: draw.ran_at,
      ranByEmail: emailByUserId.get(draw.ran_by) ?? null,
      winners: (winnerRows ?? [])
        .filter((w) => w.draw_id === draw.id)
        .map((w) => ({
          position: w.position,
          code: w.code_entries?.code ?? "",
          fullName: w.code_entries?.full_name ?? "",
          contact: w.code_entries?.contact ?? "",
        })),
    });
  }

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
        <span className="text-neutral-900">Extragere</span>
      </div>
      <h1 className="mt-1 text-2xl font-semibold text-neutral-900">
        Extragere câștigători
      </h1>

      {(tiers ?? []).length === 0 ? (
        <p className="mt-6 text-sm text-neutral-600">
          Această campanie nu are premii configurate.
        </p>
      ) : (
        <div className="mt-6 space-y-3">
          {(tiers ?? []).map((tier) => (
            <DrawPanel
              key={tier.id}
              campaignId={campaign.id}
              tier={tier}
              eligibleCount={eligibleCount ?? 0}
              existingDraw={drawByTierId.get(tier.id) ?? null}
            />
          ))}
        </div>
      )}
    </div>
  );
}
