"use client";

import { useState } from "react";
import Link from "next/link";
import { StepProducts } from "@/components/wizard/StepProducts";
import { StepCodeFormat } from "@/components/wizard/StepCodeFormat";
import { StepPrizes } from "@/components/wizard/StepPrizes";
import { StepLaunch } from "@/components/wizard/StepLaunch";
import type { CodeCharset } from "@/lib/code-format";

export type Campaign = {
  id: string;
  name: string;
  slug: string;
  status: string;
  created_at: string;
  code_length: number | null;
  code_charset: CodeCharset | null;
  single_use_codes: boolean;
  block_invalid_format: boolean;
  limit_per_contact_24h: number | null;
  starts_at: string | null;
  ends_at: string | null;
  rules_pdf_path: string | null;
};

interface WizardStepperProps {
  campaign: Campaign;
}

const STEPS = [
  { number: 1, label: "Produse" },
  { number: 2, label: "Format cod" },
  { number: 3, label: "Premii" },
  { number: 4, label: "Date & regulament" },
];

export function WizardStepper({ campaign }: WizardStepperProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [launchedSlug, setLaunchedSlug] = useState<string | null>(null);

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (launchedSlug) {
    return (
      <div className="app-canvas flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md rounded-lg border border-emerald-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-2xl">
            ✓
          </div>
          <h2 className="mt-4 text-xl font-semibold text-neutral-900">
            Campania a fost lansată!
          </h2>
          <p className="mt-2 text-sm text-neutral-600">
            Pagina publică este disponibilă la:
          </p>
          <p className="mt-1 font-mono text-sm text-neutral-900">
            /c/{launchedSlug}
          </p>
          <Link
            href="/dashboard/campaigns"
            className="mt-6 inline-flex items-center justify-center rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-neutral-800"
          >
            Înapoi la campanii
          </Link>
        </div>
      </div>
    );
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <StepProducts campaignId={campaign.id} />;
      case 2:
        return <StepCodeFormat campaign={campaign} />;
      case 3:
        return <StepPrizes campaignId={campaign.id} />;
      case 4:
        return (
          <StepLaunch campaign={campaign} onLaunched={setLaunchedSlug} />
        );
      default:
        return null;
    }
  };

  return (
    <div className="app-canvas min-h-screen">
      <div className="mx-auto max-w-2xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-neutral-900">
            {campaign.name}
          </h1>
          <p className="mt-1 text-sm text-neutral-600">
            Configurare campanie nouă
          </p>
        </div>

        {/* Stepper */}
        <div className="mb-8">
          <div className="flex items-center justify-between gap-2">
            {STEPS.map((step, index) => (
              <div key={step.number} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(step.number)}
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                    currentStep >= step.number
                      ? "bg-blue-600 text-white"
                      : "bg-neutral-200 text-neutral-600 hover:bg-neutral-300"
                  }`}
                >
                  {step.number}
                </button>
                <span
                  className={`hidden text-sm font-medium sm:inline ${
                    currentStep >= step.number
                      ? "text-neutral-900"
                      : "text-neutral-600"
                  }`}
                >
                  {step.label}
                </span>
                {index < STEPS.length - 1 && (
                  <div
                    className={`mx-1 hidden h-1 w-8 rounded sm:block ${
                      currentStep > step.number
                        ? "bg-blue-600"
                        : "bg-neutral-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="rounded-lg border border-neutral-200 bg-white p-8">
          {renderStepContent()}
        </div>

        {/* Navigation */}
        <div className="mt-8 flex justify-between gap-4">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="inline-flex items-center gap-2 rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-900 shadow-sm transition-colors hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            ← Înapoi
          </button>

          {currentStep < STEPS.length && (
            <button
              onClick={handleNext}
              className="inline-flex items-center gap-2 rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Continuă →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
