"use client";

import { useState, useEffect, useCallback } from "react";
import {
  listPrizeTiers,
  createPrizeTier,
  updatePrizeTier,
  deletePrizeTier,
} from "@/lib/actions/prizes";
import type { PrizeTierInput } from "@/lib/validations/prize";

type PrizeTier = {
  id: string;
  name: string;
  quantity: number | null;
  value_lei: number;
  kind: "instant" | "draw";
  taxable: boolean;
  sort_order: number;
};

interface StepPrizesProps {
  campaignId: string;
}

const emptyForm: PrizeTierInput = {
  name: "",
  quantity: null,
  value_lei: 0,
  kind: "instant",
};

export function StepPrizes({ campaignId }: StepPrizesProps) {
  const [tiers, setTiers] = useState<PrizeTier[]>([]);
  const [form, setForm] = useState<PrizeTierInput>(emptyForm);
  const [unlimited, setUnlimited] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [taxThreshold, setTaxThreshold] = useState(600);

  const load = useCallback(async () => {
    const data = await listPrizeTiers(campaignId);
    setTiers(data as PrizeTier[]);
  }, [campaignId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSaving(true);

    try {
      const result = await createPrizeTier(campaignId, {
        ...form,
        quantity: unlimited ? null : form.quantity,
      });
      setTaxThreshold(result.tax.thresholdLei);
      setForm(emptyForm);
      setUnlimited(true);
      await load();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Eroare la adăugarea premiului"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (tierId: string) => {
    await deletePrizeTier(tierId, campaignId);
    await load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-neutral-900">
          Niveluri de premii
        </h2>
        <p className="mt-2 text-sm text-neutral-600">
          Adăugați premiile și regulile de distribuire.
        </p>
      </div>

      <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
        Premiile peste {taxThreshold} lei/câștigător sunt impozitate conform
        legii.
      </div>

      {tiers.length > 0 && (
        <ul className="space-y-2">
          {tiers.map((tier) => (
            <li
              key={tier.id}
              className="flex items-center justify-between rounded-lg border border-neutral-200 p-4"
            >
              <div>
                <p className="text-sm font-medium text-neutral-900">
                  {tier.name}
                  {tier.taxable && (
                    <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                      Impozitat
                    </span>
                  )}
                </p>
                <p className="mt-0.5 text-xs text-neutral-500">
                  {tier.quantity === null ? "Nelimitat" : `${tier.quantity} buc.`}
                  {" · "}
                  {tier.value_lei} lei
                  {" · "}
                  {tier.kind === "instant" ? "Instant-win" : "Extragere finală"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(tier.id)}
                className="text-sm text-red-600 hover:text-red-800"
              >
                Șterge
              </button>
            </li>
          ))}
        </ul>
      )}

      <form
        onSubmit={handleAdd}
        className="space-y-4 rounded-lg border border-neutral-200 bg-neutral-50 p-4"
      >
        <div>
          <label className="block text-sm font-medium text-neutral-700">
            Nume premiu
          </label>
          <input
            type="text"
            placeholder="ex: Voucher 1.000 lei"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="mt-1 block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700">
              Valoare (lei)
            </label>
            <input
              type="number"
              min={0}
              step="0.01"
              value={form.value_lei}
              onChange={(e) =>
                setForm({ ...form, value_lei: Number(e.target.value) })
              }
              className="mt-1 block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700">
              Tip
            </label>
            <select
              value={form.kind}
              onChange={(e) =>
                setForm({
                  ...form,
                  kind: e.target.value as "instant" | "draw",
                })
              }
              className="mt-1 block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
            >
              <option value="instant">Instant-win</option>
              <option value="draw">Extragere finală</option>
            </select>
          </div>
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm text-neutral-800">
            <input
              type="checkbox"
              checked={unlimited}
              onChange={(e) => setUnlimited(e.target.checked)}
              className="h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
            />
            Cantitate nelimitată
          </label>
          {!unlimited && (
            <input
              type="number"
              min={1}
              placeholder="Cantitate"
              value={form.quantity ?? ""}
              onChange={(e) =>
                setForm({ ...form, quantity: Number(e.target.value) })
              }
              className="mt-2 block w-32 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
            />
          )}
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={!form.name.trim() || isSaving}
          className="inline-flex items-center justify-center rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? "Se adaugă..." : "+ Adaugă premiu"}
        </button>
      </form>
    </div>
  );
}
