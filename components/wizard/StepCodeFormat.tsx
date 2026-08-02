"use client";

import { useState, useTransition } from "react";
import { buildCodeRegex, buildCodePreview, type CodeCharset } from "@/lib/code-format";
import { updateCampaignDraft } from "@/lib/actions/campaigns";

type Campaign = {
  id: string;
  code_length: number | null;
  code_charset: CodeCharset | null;
  single_use_codes: boolean;
  block_invalid_format: boolean;
  limit_per_contact_24h: number | null;
};

const CHARSET_OPTIONS: { value: CodeCharset; label: string }[] = [
  { value: "letters", label: "Doar litere" },
  { value: "digits", label: "Doar cifre" },
  { value: "alphanumeric", label: "Litere și cifre" },
];

interface StepCodeFormatProps {
  campaign: Campaign;
}

export function StepCodeFormat({ campaign }: StepCodeFormatProps) {
  const [length, setLength] = useState(campaign.code_length ?? 10);
  const [charset, setCharset] = useState<CodeCharset>(
    campaign.code_charset ?? "alphanumeric"
  );
  const [singleUse, setSingleUse] = useState(campaign.single_use_codes);
  const [blockInvalid, setBlockInvalid] = useState(
    campaign.block_invalid_format
  );
  const [limitEnabled, setLimitEnabled] = useState(
    !!campaign.limit_per_contact_24h
  );
  const [limitValue, setLimitValue] = useState(
    campaign.limit_per_contact_24h ?? 1
  );
  const [isPending, startTransition] = useTransition();

  const save = (overrides: Partial<Record<string, unknown>> = {}) => {
    startTransition(() => {
      updateCampaignDraft(campaign.id, {
        code_length: length,
        code_charset: charset,
        code_regex: buildCodeRegex(length, charset),
        single_use_codes: singleUse,
        block_invalid_format: blockInvalid,
        limit_per_contact_24h: limitEnabled ? limitValue : 0,
        ...overrides,
      });
    });
  };

  const handleLengthChange = (value: number) => {
    setLength(value);
    startTransition(() => {
      updateCampaignDraft(campaign.id, {
        code_length: value,
        code_charset: charset,
        code_regex: buildCodeRegex(value, charset),
      });
    });
  };

  const handleCharsetChange = (value: CodeCharset) => {
    setCharset(value);
    startTransition(() => {
      updateCampaignDraft(campaign.id, {
        code_length: length,
        code_charset: value,
        code_regex: buildCodeRegex(length, value),
      });
    });
  };

  const preview = buildCodePreview(length, charset);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-neutral-900">
          Format cod
        </h2>
        <p className="mt-2 text-sm text-neutral-600">
          Configurați lungimea și tipul codurilor promoționale.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700">
            Lungime cod
          </label>
          <input
            type="number"
            min={6}
            max={14}
            value={length}
            onChange={(e) => handleLengthChange(Number(e.target.value))}
            className="mt-1 block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
          />
          <p className="mt-1 text-xs text-neutral-500">Între 6 și 14 caractere</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700">
            Tip caractere
          </label>
          <select
            value={charset}
            onChange={(e) => handleCharsetChange(e.target.value as CodeCharset)}
            className="mt-1 block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
          >
            {CHARSET_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-center">
        <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">
          Previzualizare
        </p>
        <p className="mt-2 font-mono text-xl tracking-widest text-neutral-900">
          {preview}
        </p>
      </div>

      <div className="space-y-3">
        <label className="flex items-center justify-between gap-3 rounded-md border border-neutral-200 p-3">
          <span className="text-sm text-neutral-800">
            Un singur folosire per cod
          </span>
          <input
            type="checkbox"
            checked={singleUse}
            onChange={(e) => {
              setSingleUse(e.target.checked);
              save({ single_use_codes: e.target.checked });
            }}
            className="h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
          />
        </label>

        <label className="flex items-center justify-between gap-3 rounded-md border border-neutral-200 p-3">
          <span className="text-sm text-neutral-800">
            Blochează codurile cu format invalid
          </span>
          <input
            type="checkbox"
            checked={blockInvalid}
            onChange={(e) => {
              setBlockInvalid(e.target.checked);
              save({ block_invalid_format: e.target.checked });
            }}
            className="h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
          />
        </label>

        <div className="rounded-md border border-neutral-200 p-3">
          <label className="flex items-center justify-between gap-3">
            <span className="text-sm text-neutral-800">
              Limitează înscrieri per contact / 24h
            </span>
            <input
              type="checkbox"
              checked={limitEnabled}
              onChange={(e) => {
                setLimitEnabled(e.target.checked);
                save({
                  limit_per_contact_24h: e.target.checked ? limitValue : 0,
                });
              }}
              className="h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
            />
          </label>
          {limitEnabled && (
            <input
              type="number"
              min={1}
              value={limitValue}
              onChange={(e) => {
                const value = Number(e.target.value);
                setLimitValue(value);
                save({ limit_per_contact_24h: value });
              }}
              className="mt-2 block w-24 rounded-md border border-neutral-300 bg-white px-2 py-1 text-sm text-neutral-900 shadow-sm outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
            />
          )}
        </div>
      </div>

      {isPending && (
        <p className="text-xs text-neutral-400">Se salvează...</p>
      )}
    </div>
  );
}
