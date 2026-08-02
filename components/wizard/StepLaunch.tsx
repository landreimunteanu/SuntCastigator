"use client";

import { useState, useRef } from "react";
import { updateCampaignDraft } from "@/lib/actions/campaigns";
import { uploadRulesPdf } from "@/lib/storage/rules";
import { launchCampaign } from "@/lib/actions/launch";

type Campaign = {
  id: string;
  name: string;
  slug: string;
  starts_at?: string | null;
  ends_at?: string | null;
  rules_pdf_path?: string | null;
};

interface StepLaunchProps {
  campaign: Campaign;
  onLaunched: (slug: string) => void;
}

export function StepLaunch({ campaign, onLaunched }: StepLaunchProps) {
  const [startsAt, setStartsAt] = useState(campaign.starts_at ?? "");
  const [endsAt, setEndsAt] = useState(campaign.ends_at ?? "");
  const [pdfPath, setPdfPath] = useState(campaign.rules_pdf_path ?? "");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [compliance, setCompliance] = useState(false);
  const [launchErrors, setLaunchErrors] = useState<string[]>([]);
  const [isLaunching, setIsLaunching] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDateChange = (field: "starts_at" | "ends_at", value: string) => {
    if (field === "starts_at") setStartsAt(value);
    else setEndsAt(value);

    if (value) {
      updateCampaignDraft(campaign.id, { [field]: value });
    }
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError("");

    try {
      const result = await uploadRulesPdf(campaign.id, file);
      setPdfPath(result.path);
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : "Eroare la încărcarea PDF-ului"
      );
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleLaunch = async () => {
    setLaunchErrors([]);
    setIsLaunching(true);

    try {
      const result = await launchCampaign(campaign.id);
      if (!result.ok) {
        setLaunchErrors(result.errors);
      } else if (result.slug) {
        onLaunched(result.slug);
      }
    } catch (err) {
      setLaunchErrors([
        err instanceof Error ? err.message : "Eroare la lansarea campaniei",
      ]);
    } finally {
      setIsLaunching(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-neutral-900">
          Date și regulament
        </h2>
        <p className="mt-2 text-sm text-neutral-600">
          Setați datele de start/end și încărcați regulamentul.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700">
            Data de început
          </label>
          <input
            type="date"
            value={startsAt}
            onChange={(e) => handleDateChange("starts_at", e.target.value)}
            className="mt-1 block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700">
            Data de sfârșit
          </label>
          <input
            type="date"
            value={endsAt}
            onChange={(e) => handleDateChange("ends_at", e.target.value)}
            className="mt-1 block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700">
          Regulament (PDF, max 10 MB)
        </label>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          onChange={handlePdfUpload}
          disabled={isUploading}
          className="mt-1 block w-full text-sm text-neutral-700 file:mr-3 file:rounded-md file:border-0 file:bg-neutral-900 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-neutral-800"
        />
        {isUploading && (
          <p className="mt-1 text-sm text-neutral-600">Se încarcă...</p>
        )}
        {uploadError && (
          <p className="mt-1 text-sm text-red-600">{uploadError}</p>
        )}
        {pdfPath && !isUploading && (
          <p className="mt-1 text-sm text-emerald-700">
            ✓ Regulament încărcat
          </p>
        )}
      </div>

      <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
        <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">
          Rezumat campanie
        </p>
        <dl className="mt-2 space-y-1 text-sm text-neutral-700">
          <div className="flex justify-between">
            <dt>Nume</dt>
            <dd className="font-medium">{campaign.name}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Perioadă</dt>
            <dd className="font-medium">
              {startsAt || "—"} – {endsAt || "—"}
            </dd>
          </div>
        </dl>
      </div>

      <label className="flex items-start gap-2 text-sm text-neutral-800">
        <input
          type="checkbox"
          checked={compliance}
          onChange={(e) => setCompliance(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
        />
        <span>
          Confirm că regulamentul și datele campaniei respectă legislația în
          vigoare.
        </span>
      </label>

      {launchErrors.length > 0 && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3">
          <p className="text-sm font-medium text-red-800">
            Nu poți lansa campania încă:
          </p>
          <ul className="mt-1 list-inside list-disc text-sm text-red-700">
            {launchErrors.map((err) => (
              <li key={err}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      <button
        type="button"
        onClick={handleLaunch}
        disabled={!compliance || isLaunching}
        className="inline-flex w-full items-center justify-center rounded-md bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLaunching ? "Se lansează..." : "Lansează campania"}
      </button>
    </div>
  );
}
