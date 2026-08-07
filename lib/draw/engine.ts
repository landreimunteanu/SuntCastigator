import { createHash } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

// ---------------------------------------------------------------------------
// Pure, DB-free primitives. Given only the stored seed and the ordered
// participant snapshot, these reproduce the exact same winners outside the
// app — the auditability guarantee the draw exists for. Kept free of any
// Supabase import so they're independently testable (see engine.test.mjs).
// ---------------------------------------------------------------------------

export function generateSeed(): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

// mulberry32 — tiny seeded PRNG, inlined to avoid a dependency. Seed is
// folded from the first 8 hex chars (32 bits) of the stored seed.
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffleWithSeed<T>(items: readonly T[], seedHex: string): T[] {
  const seedInt = parseInt(seedHex.slice(0, 8), 16);
  const rand = mulberry32(seedInt);
  const result = items.slice();
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function computeParticipantsHash(orderedIds: readonly string[]): string {
  return createHash("sha256").update(orderedIds.join("\n")).digest("hex");
}

export function pickWinners(
  orderedParticipantIds: readonly string[],
  seedHex: string,
  count: number
): string[] {
  return shuffleWithSeed(orderedParticipantIds, seedHex).slice(0, count);
}

// ---------------------------------------------------------------------------
// DB orchestration
// ---------------------------------------------------------------------------

export type RunDrawResult =
  | {
      ok: true;
      drawId: string;
      seed: string;
      winnerEntryIds: string[];
      participantCount: number;
    }
  | {
      ok: false;
      error: "not_found" | "not_draw_tier" | "already_drawn" | "no_participants";
    };

// Assumes the caller has already verified the requesting user owns
// `campaignId`'s brand and holds the 'owner' role — see
// app/api/campaigns/[id]/draw/route.ts.
export async function runDraw(
  campaignId: string,
  prizeTierId: string,
  ranBy: string
): Promise<RunDrawResult> {
  const supabase = await createClient();

  const { data: tier } = await supabase
    .from("prize_tiers")
    .select("id, campaign_id, kind, quantity")
    .eq("id", prizeTierId)
    .eq("campaign_id", campaignId)
    .maybeSingle();

  if (!tier) return { ok: false, error: "not_found" };
  if (tier.kind !== "draw") return { ok: false, error: "not_draw_tier" };

  const { data: existingDraw } = await supabase
    .from("draws")
    .select("id")
    .eq("campaign_id", campaignId)
    .eq("prize_tier_id", prizeTierId)
    .maybeSingle();
  if (existingDraw) return { ok: false, error: "already_drawn" };

  const { data: entries } = await supabase
    .from("code_entries")
    .select("id")
    .eq("campaign_id", campaignId)
    .eq("status", "valid")
    .order("id", { ascending: true });

  const participantIds = (entries ?? []).map((e) => e.id as string);
  if (participantIds.length === 0) {
    return { ok: false, error: "no_participants" };
  }

  const seed = generateSeed();
  const participantsHash = computeParticipantsHash(participantIds);
  // Null quantity ("Nelimitat") on a draw-kind tier reads as "rank everyone" —
  // the shuffle still assigns every participant a position, just without a cap.
  const winnersCount =
    tier.quantity == null
      ? participantIds.length
      : Math.min(tier.quantity, participantIds.length);
  const winnerEntryIds = pickWinners(participantIds, seed, winnersCount);

  // No INSERT policy exists for authenticated users on `draws`/`winners`
  // (see 0001_init.sql) — the atomic write goes through record_draw() via
  // the service-role client, mirroring submit_entry()'s pattern.
  const service = createServiceClient();
  const { data: drawId, error } = await service.rpc("record_draw", {
    p_campaign_id: campaignId,
    p_prize_tier_id: prizeTierId,
    p_seed: seed,
    p_participant_count: participantIds.length,
    p_participants_hash: participantsHash,
    p_ran_by: ranBy,
    p_winner_entry_ids: winnerEntryIds,
  });

  if (error) {
    if (error.message === "already_drawn") {
      return { ok: false, error: "already_drawn" };
    }
    throw new Error(`record_draw failed: ${error.message}`);
  }

  return {
    ok: true,
    drawId: drawId as string,
    seed,
    winnerEntryIds,
    participantCount: participantIds.length,
  };
}
