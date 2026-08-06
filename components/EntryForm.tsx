"use client";

import { useMemo, useState, useTransition, type FormEvent } from "react";
import { entrySubmissionSchema } from "@/lib/validations/entry";

type Props = {
  campaignId: string;
  codeRegex: string | null;
  rulesPdfUrl: string | null;
  brandName: string;
};

type ApiOk = { status: "valid" | "duplicate" | "invalid" };
type ApiErr = { error: string; reason?: string };

type UiState =
  | { kind: "idle" }
  | { kind: "success" }
  | { kind: "duplicate" }
  | { kind: "invalid_format" }
  | { kind: "rate_limited" }
  | { kind: "ended" }
  | { kind: "not_active" }
  | { kind: "error" };

export default function EntryForm({
  campaignId,
  codeRegex,
  rulesPdfUrl,
  brandName,
}: Props) {
  const [code, setCode] = useState("");
  const [fullName, setFullName] = useState("");
  const [contact, setContact] = useState("");
  const [gdprConsent, setGdprConsent] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [state, setState] = useState<UiState>({ kind: "idle" });
  const [pending, startTransition] = useTransition();

  // Compile the regex once per session; if the stored value is malformed we
  // simply skip client-side format checking — the server is authoritative.
  const compiledRegex = useMemo(() => {
    if (!codeRegex) return null;
    try {
      return new RegExp(codeRegex);
    } catch {
      return null;
    }
  }, [codeRegex]);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFieldError(null);

    const normalizedCode = code.trim().toUpperCase();

    const parsed = entrySubmissionSchema.safeParse({
      campaignId,
      code: normalizedCode,
      fullName,
      contact,
      gdprConsent,
    });
    if (!parsed.success) {
      setFieldError(
        parsed.error.issues[0]?.message ?? "Verifică datele introduse"
      );
      return;
    }

    if (compiledRegex && !compiledRegex.test(normalizedCode)) {
      setFieldError("Codul nu are formatul corect");
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch("/api/entries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsed.data),
        });

        if (res.status === 201) {
          setState({ kind: "success" });
          return;
        }
        if (res.status === 409) {
          setState({ kind: "duplicate" });
          return;
        }
        if (res.status === 429) {
          setState({ kind: "rate_limited" });
          return;
        }

        const payload = (await res.json().catch(() => ({}))) as
          | ApiOk
          | ApiErr;

        if ("status" in payload && payload.status === "invalid") {
          setState({ kind: "invalid_format" });
          return;
        }
        if ("error" in payload) {
          if (payload.error === "campaign_ended") {
            setState({ kind: "ended" });
            return;
          }
          if (
            payload.error === "campaign_not_active" ||
            payload.error === "campaign_not_started"
          ) {
            setState({ kind: "not_active" });
            return;
          }
        }
        setState({ kind: "error" });
      } catch {
        setState({ kind: "error" });
      }
    });
  }

  if (state.kind === "success") {
    return (
      <div
        role="status"
        className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center"
      >
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-2xl text-emerald-700">
          ✓
        </div>
        <p className="mt-3 text-base font-semibold text-emerald-900">
          Înscrierea a fost înregistrată
        </p>
        <p className="mt-1 text-sm text-emerald-800">
          Mult succes la extragere! Îți mulțumim că participi la promoția{" "}
          <strong>{brandName}</strong>.
        </p>
      </div>
    );
  }

  const banner = renderBanner(state);

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {banner}

      <div>
        <label
          htmlFor="code"
          className="block text-xs font-semibold uppercase tracking-wider text-neutral-600"
        >
          Cod promoțional
        </label>
        <input
          id="code"
          name="code"
          type="text"
          inputMode="text"
          autoComplete="off"
          autoCapitalize="characters"
          required
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          disabled={pending}
          placeholder="AB3X9KQ7M2"
          className="mt-1.5 block w-full rounded-md border border-neutral-300 bg-white px-3 py-3 text-base uppercase tracking-widest text-neutral-900 shadow-sm outline-none placeholder:text-neutral-300 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 disabled:bg-neutral-50"
        />
      </div>

      <div>
        <label
          htmlFor="fullName"
          className="block text-xs font-semibold uppercase tracking-wider text-neutral-600"
        >
          Nume complet
        </label>
        <input
          id="fullName"
          name="fullName"
          type="text"
          autoComplete="name"
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          disabled={pending}
          placeholder="Ion Popescu"
          className="mt-1.5 block w-full rounded-md border border-neutral-300 bg-white px-3 py-2.5 text-base text-neutral-900 shadow-sm outline-none placeholder:text-neutral-400 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 disabled:bg-neutral-50"
        />
      </div>

      <div>
        <label
          htmlFor="contact"
          className="block text-xs font-semibold uppercase tracking-wider text-neutral-600"
        >
          Telefon sau email
        </label>
        <input
          id="contact"
          name="contact"
          type="text"
          autoComplete="email"
          required
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          disabled={pending}
          placeholder="0722123456 sau nume@email.ro"
          className="mt-1.5 block w-full rounded-md border border-neutral-300 bg-white px-3 py-2.5 text-base text-neutral-900 shadow-sm outline-none placeholder:text-neutral-400 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 disabled:bg-neutral-50"
        />
      </div>

      <label className="flex items-start gap-2 text-sm text-neutral-800">
        <input
          type="checkbox"
          checked={gdprConsent}
          onChange={(e) => setGdprConsent(e.target.checked)}
          disabled={pending}
          className="mt-0.5 h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
        />
        <span>
          Sunt de acord cu prelucrarea datelor mele pentru participarea la
          campanie, conform{" "}
          {rulesPdfUrl ? (
            <a
              href={rulesPdfUrl}
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-2 hover:text-neutral-900"
            >
              regulamentului oficial
            </a>
          ) : (
            <span>regulamentului oficial</span>
          )}
          .
        </span>
      </label>

      {fieldError && (
        <p role="alert" className="text-sm text-red-600">
          {fieldError}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex w-full items-center justify-center rounded-md bg-neutral-900 px-4 py-3 text-sm font-semibold uppercase tracking-wider text-white shadow-sm transition-colors hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Se trimite..." : "Înscrie codul"}
      </button>
    </form>
  );
}

function renderBanner(state: UiState) {
  if (state.kind === "idle" || state.kind === "success") return null;

  const map: Record<
    Exclude<UiState["kind"], "idle" | "success">,
    { title: string; body: string; tone: "warn" | "error" }
  > = {
    duplicate: {
      title: "Acest cod a fost deja folosit",
      body: "Fiecare cod poate fi înscris o singură dată în această campanie.",
      tone: "warn",
    },
    invalid_format: {
      title: "Codul nu are formatul corect",
      body: "Verifică pe ambalaj și încearcă din nou.",
      tone: "warn",
    },
    rate_limited: {
      title: "Prea multe încercări",
      body: "Ai trimis prea multe coduri într-un timp scurt. Revino mai târziu.",
      tone: "warn",
    },
    ended: {
      title: "Campania s-a încheiat",
      body: "Perioada de înscriere s-a terminat. Îți mulțumim pentru interes.",
      tone: "warn",
    },
    not_active: {
      title: "Campania nu este activă",
      body: "Această campanie nu primește momentan înscrieri.",
      tone: "warn",
    },
    error: {
      title: "Nu am putut înregistra înscrierea",
      body: "Încearcă din nou peste câteva momente.",
      tone: "error",
    },
  };

  const entry = map[state.kind];
  const cls =
    entry.tone === "error"
      ? "border-red-200 bg-red-50 text-red-800"
      : "border-amber-200 bg-amber-50 text-amber-900";

  return (
    <div role="alert" className={`rounded-md border p-3 text-sm ${cls}`}>
      <p className="font-semibold">{entry.title}</p>
      <p className="mt-0.5">{entry.body}</p>
    </div>
  );
}
