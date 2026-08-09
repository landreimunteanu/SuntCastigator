"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export type WinnerRow = {
  position: number;
  code: string;
  fullName: string;
  contact: string;
};

export type ExistingDraw = {
  id: string;
  seed: string;
  participantCount: number;
  participantsHash: string;
  ranAt: string;
  ranByEmail: string | null;
  winners: WinnerRow[];
};

type Props = {
  campaignId: string;
  tier: {
    id: string;
    name: string;
    quantity: number | null;
    kind: "instant" | "draw";
  };
  eligibleCount: number;
  existingDraw: ExistingDraw | null;
};

function maskContact(contact: string): string {
  if (contact.includes("@")) {
    const [user, domain] = contact.split("@");
    const visible = user.slice(0, 2) || user;
    return `${visible}${"*".repeat(Math.max(3, user.length - visible.length))}@${domain}`;
  }
  const digits = contact.replace(/\s+/g, "");
  if (digits.length <= 5) return contact;
  return `${digits.slice(0, 2)}xx xxx ${digits.slice(-3)}`;
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("ro-RO", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function DrawPanel({ campaignId, tier, eligibleCount, existingDraw }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  // A draw is one-shot — uq_draws_campaign_tier blocks re-running it — and
  // picks real winners, so a bare button with no confirmation is one
  // misclick away from a support call. Requires a second, explicit click.
  const [confirming, setConfirming] = useState(false);

  function runDraw() {
    setError(null);
    setConfirming(false);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/campaigns/${campaignId}/draw`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prizeTierId: tier.id }),
        });
        if (res.status === 201) {
          router.refresh();
          return;
        }
        const payload = await res.json().catch(() => ({}));
        setError(mapError(payload.error, res.status));
      } catch {
        setError("Nu am putut rula extragerea. Încearcă din nou.");
      }
    });
  }

  async function copyList() {
    if (!existingDraw) return;
    const lines = [
      "Poziție\tCod\tNume\tContact",
      ...existingDraw.winners.map(
        (w) => `${w.position}\t${w.code}\t${w.fullName}\t${w.contact}`
      ),
    ];
    await navigator.clipboard.writeText(lines.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (tier.kind === "instant") {
    return (
      <div className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white p-4">
        <div>
          <p className="font-medium text-neutral-900">{tier.name}</p>
          <p className="text-sm text-neutral-500">
            Instant-win — câștigătorii sunt determinați la înscriere.
          </p>
        </div>
        <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-600">
          Automat
        </span>
      </div>
    );
  }

  if (!existingDraw) {
    return (
      <div className="rounded-lg border border-neutral-200 bg-white p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-medium text-neutral-900">{tier.name}</p>
            <p className="text-sm text-neutral-500">
              {tier.quantity ?? "Nelimitat"} câștigători ·{" "}
              {eligibleCount} participanți eligibili
            </p>
          </div>
          {confirming ? (
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => setConfirming(false)}
                disabled={pending}
                className="inline-flex items-center justify-center rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-800 shadow-sm transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Anulează
              </button>
              <button
                type="button"
                onClick={runDraw}
                disabled={pending}
                className="inline-flex items-center justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {pending ? "Se extrage..." : "Da, extrage — ireversibil"}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              disabled={pending || eligibleCount === 0}
              className="inline-flex shrink-0 items-center justify-center rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              🎲 Rulează extragerea
            </button>
          )}
        </div>
        {confirming && (
          <p className="mt-2 text-sm text-amber-700">
            Extragerea este definitivă și nu poate fi refăcută pentru această categorie de premii.
          </p>
        )}
        {eligibleCount === 0 && (
          <p className="mt-2 text-sm text-amber-700">
            Nu există participanți eligibili pentru extragere.
          </p>
        )}
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  const allEmails = existingDraw.winners.every((w) => w.contact.includes("@"));
  const bccMailto = allEmails
    ? `mailto:?bcc=${encodeURIComponent(
        existingDraw.winners.map((w) => w.contact).join(",")
      )}&subject=${encodeURIComponent(`Felicitări! Ai câștigat — ${tier.name}`)}`
    : null;

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <p className="font-medium text-neutral-900">{tier.name}</p>
        <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
          Extrasă
        </span>
      </div>

      <div className="mt-3 overflow-hidden rounded-md border border-neutral-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-50 text-xs uppercase tracking-wider text-neutral-500">
            <tr>
              <th className="px-3 py-2 font-medium">#</th>
              <th className="px-3 py-2 font-medium">Cod</th>
              <th className="px-3 py-2 font-medium">Participant</th>
              <th className="px-3 py-2 font-medium">Contact</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {existingDraw.winners.map((w) => (
              <tr key={w.position}>
                <td className="px-3 py-2 text-neutral-500">{w.position}</td>
                <td className="px-3 py-2 font-mono text-xs tracking-wider text-neutral-900">
                  {w.code}
                </td>
                <td className="px-3 py-2 text-neutral-800">{w.fullName}</td>
                <td className="px-3 py-2 text-neutral-600">
                  {maskContact(w.contact)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-neutral-500">
        Extragere rulată{existingDraw.ranByEmail ? ` de ${existingDraw.ranByEmail}` : ""} pe{" "}
        {formatDateTime(existingDraw.ranAt)} · {existingDraw.participantCount} participanți
        · seed <span className="font-mono">{existingDraw.seed}</span> · hash{" "}
        <span className="font-mono">{existingDraw.participantsHash.slice(0, 12)}…</span>
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={copyList}
          className="inline-flex items-center justify-center rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-800 shadow-sm transition-colors hover:bg-neutral-50"
        >
          {copied ? "✓ Copiat" : "Copiază lista"}
        </button>
        <a
          href={`/api/draws/${existingDraw.id}/export`}
          className="inline-flex items-center justify-center rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-800 shadow-sm transition-colors hover:bg-neutral-50"
        >
          Exportă CSV
        </a>
        {bccMailto && (
          <a
            href={bccMailto}
            className="inline-flex items-center justify-center rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-800 shadow-sm transition-colors hover:bg-neutral-50"
          >
            Trimite email câștigătorilor
          </a>
        )}
      </div>
    </div>
  );
}

function mapError(error: string | undefined, status: number): string {
  switch (error) {
    case "already_drawn":
      return "Această categorie a fost deja extrasă.";
    case "no_participants":
      return "Nu există participanți eligibili pentru extragere.";
    case "not_draw_tier":
      return "Această categorie nu necesită extragere.";
    case "not_found":
      return "Categoria de premii nu a fost găsită.";
    case "forbidden":
      return "Doar proprietarul brandului poate rula extragerea.";
    default:
      return status >= 500
        ? "Eroare la server. Încearcă din nou."
        : "Nu am putut rula extragerea.";
  }
}
