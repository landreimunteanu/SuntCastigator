import { createClient } from "@/lib/supabase/server";

export type DayCount = {
  date: string; // YYYY-MM-DD
  valid: number;
  rejected: number; // duplicate + invalid
};

// Aggregates by day in JS rather than a DB-side date_trunc RPC — supabase-js
// has no generic "group by" query builder, and a one-off SQL function felt
// like overkill for a single dashboard chart. Entry volume per campaign is
// small enough (thousands, not millions) for this to be cheap.
export async function getEntriesByDay(campaignId: string): Promise<DayCount[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("code_entries")
    .select("status, created_at")
    .eq("campaign_id", campaignId)
    .order("created_at", { ascending: true });

  const byDay = new Map<string, DayCount>();

  for (const row of data ?? []) {
    const day = row.created_at.slice(0, 10);
    let bucket = byDay.get(day);
    if (!bucket) {
      bucket = { date: day, valid: 0, rejected: 0 };
      byDay.set(day, bucket);
    }
    if (row.status === "valid") bucket.valid += 1;
    else bucket.rejected += 1;
  }

  return Array.from(byDay.values()).sort((a, b) => a.date.localeCompare(b.date));
}
