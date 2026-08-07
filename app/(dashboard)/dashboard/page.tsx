import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBrand } from "@/lib/supabase/get-brand";
import { StatCard } from "@/components/StatCard";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const brand = await getCurrentBrand();
  if (!brand) return null; // layout already renders the "no brand" message

  const supabase = await createClient();

  const [{ count: active }, { count: draft }, { count: ended }] =
    await Promise.all([
      supabase
        .from("campaigns")
        .select("id", { count: "exact", head: true })
        .eq("brand_id", brand.brand.id)
        .eq("status", "active"),
      supabase
        .from("campaigns")
        .select("id", { count: "exact", head: true })
        .eq("brand_id", brand.brand.id)
        .eq("status", "draft"),
      supabase
        .from("campaigns")
        .select("id", { count: "exact", head: true })
        .eq("brand_id", brand.brand.id)
        .eq("status", "ended"),
    ]);

  const total = (active ?? 0) + (draft ?? 0) + (ended ?? 0);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-neutral-900">
        Bun venit, {brand.brand.name}
      </h1>
      <p className="mt-2 text-sm text-neutral-600">
        {total === 0
          ? "Nu ai nicio campanie încă — creează prima campanie pentru a începe."
          : "Iată o privire de ansamblu asupra campaniilor tale."}
      </p>

      {total > 0 && (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 sm:max-w-xl">
          <StatCard label="Active" value={active ?? 0} tone="positive" />
          <StatCard label="Ciorne" value={draft ?? 0} />
          <StatCard label="Încheiate" value={ended ?? 0} />
        </div>
      )}

      <div className="mt-6 flex items-center gap-3">
        <Link
          href="/dashboard/campaigns/new"
          className="inline-flex items-center justify-center rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-neutral-800"
        >
          + Campanie nouă
        </Link>
        {total > 0 && (
          <Link
            href="/dashboard/campaigns"
            className="inline-flex items-center justify-center rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-800 shadow-sm transition-colors hover:bg-neutral-50"
          >
            Vezi toate campaniile
          </Link>
        )}
      </div>
    </div>
  );
}
