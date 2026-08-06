type Props = {
  label: string;
  value: string | number;
  tone?: "default" | "positive" | "negative";
};

const TONE_STYLES: Record<NonNullable<Props["tone"]>, string> = {
  default: "text-neutral-900",
  positive: "text-emerald-700",
  negative: "text-red-700",
};

export function StatCard({ label, value, tone = "default" }: Props) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">
        {label}
      </p>
      <p className={`mt-1.5 text-2xl font-semibold ${TONE_STYLES[tone]}`}>
        {value}
      </p>
    </div>
  );
}
