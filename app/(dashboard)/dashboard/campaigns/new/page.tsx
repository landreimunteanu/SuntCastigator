"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { createCampaignDraft } from "@/lib/actions/campaigns";
import { WizardStepper, type Campaign } from "@/components/wizard/WizardStepper";

function NewCampaignForm() {
  const searchParams = useSearchParams();
  const resumeId = searchParams.get("id");

  const [campaignName, setCampaignName] = useState("");
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isResuming, setIsResuming] = useState(!!resumeId);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!resumeId) return;

    const supabase = createClient();
    supabase
      .from("campaigns")
      .select(
        "id, name, slug, status, created_at, code_length, code_charset, single_use_codes, block_invalid_format, limit_per_contact_24h, starts_at, ends_at, rules_pdf_path"
      )
      .eq("id", resumeId)
      .eq("status", "draft")
      .single()
      .then(({ data }) => {
        if (data) setCampaign(data as Campaign);
        else setError("Ciorna nu a fost găsită sau a fost deja lansată.");
        setIsResuming(false);
      });
  }, [resumeId]);

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await createCampaignDraft({ name: campaignName });
      setCampaign(result as Campaign);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "A apărut o eroare la crearea campaniei"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // If campaign is created, show the stepper
  if (campaign) {
    return <WizardStepper campaign={campaign} />;
  }

  if (isResuming) {
    return (
      <div className="app-canvas flex min-h-screen items-center justify-center">
        <p className="text-sm text-neutral-600">Se încarcă ciorna...</p>
      </div>
    );
  }

  // Show initial form to enter campaign name
  return (
    <div className="app-canvas min-h-screen">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-neutral-900">
            Campanie nouă
          </h1>
          <p className="mt-2 text-sm text-neutral-600">
            Introdu numele campaniei pentru a incepe configurarea.
          </p>
        </div>

        <div className="rounded-lg border border-neutral-200 bg-white p-8">
          <form onSubmit={handleCreateCampaign} className="space-y-6">
            <div>
              <label
                htmlFor="campaign-name"
                className="block text-sm font-medium text-neutral-700"
              >
                Numele campaniei
              </label>
              <input
                id="campaign-name"
                type="text"
                placeholder="ex: Suma de vară 2026"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                disabled={isLoading}
                required
                className="mt-1 block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm outline-none placeholder:text-neutral-400 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 disabled:bg-neutral-50 disabled:text-neutral-500"
              />
              <p className="mt-1 text-xs text-neutral-500">
                Poți schimba numele mai târziu
              </p>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 p-4">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={!campaignName.trim() || isLoading}
              className="inline-flex w-full items-center justify-center rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "Se crează..." : "Creează campania"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function NewCampaignPage() {
  return (
    <Suspense
      fallback={
        <div className="app-canvas flex min-h-screen items-center justify-center">
          <p className="text-sm text-neutral-600">Se încarcă...</p>
        </div>
      }
    >
      <NewCampaignForm />
    </Suspense>
  );
}
