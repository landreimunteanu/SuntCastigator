import { createServiceClient } from "@/lib/supabase/service";

export type TaxInfo = {
  taxable: boolean;
  thresholdLei: number;
  rate: number;
  taxLei: number;
};

// Reads threshold + rate from `settings` (service-role only — see
// lib/supabase/service.ts) and computes whether a prize crosses the
// withholding threshold and how much tax is owed on it.
export async function computePrizeTax(valueLei: number): Promise<TaxInfo> {
  const supabase = createServiceClient();

  const { data } = await supabase
    .from("settings")
    .select("key, value")
    .in("key", ["prize_tax_threshold_lei", "prize_tax_rate"]);

  const thresholdRow = data?.find((r) => r.key === "prize_tax_threshold_lei");
  const rateRow = data?.find((r) => r.key === "prize_tax_rate");

  const thresholdLei = (thresholdRow?.value as { value?: number })?.value ?? 600;
  const rate = (rateRow?.value as { value?: number })?.value ?? 0.1;

  const taxable = valueLei > thresholdLei;
  const taxLei = taxable ? Math.round(valueLei * rate * 100) / 100 : 0;

  return { taxable, thresholdLei, rate, taxLei };
}
