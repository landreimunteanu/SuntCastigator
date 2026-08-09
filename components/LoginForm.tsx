"use client";

import { useState, useTransition, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { loginSchema } from "@/lib/validations/auth";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const parsed = loginSchema.safeParse({ email });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Adresă de email invalidă");
      return;
    }

    startTransition(async () => {
      const supabase = createClient();
      // shouldCreateUser: false — accounts are provisioned exclusively via
      // scripts/seed-brand.mjs (see CLAUDE.md: no self-signup). Without this,
      // any email typed here would silently create a new auth user and, on
      // first dashboard visit, appear to be a legitimate login attempt.
      const { error: authError } = await supabase.auth.signInWithOtp({
        email: parsed.data.email,
        options: {
          shouldCreateUser: false,
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      // Always show the same "check your email" state, whether or not the
      // address is actually enrolled. Surfacing "no account" vs "sent" here
      // would let anyone probe which emails are invited brand managers.
      void authError;
      setSent(true);
    });
  }

  if (sent) {
    return (
      <div role="status" className="text-center">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          ✓
        </div>
        <p className="mt-3 text-sm font-medium text-neutral-900">
          Verifică-ți emailul
        </p>
        <p className="mt-1 text-sm text-neutral-600">
          Ți-am trimis un link de conectare la <strong>{email}</strong>.
          Deschide-l pe acest dispozitiv — linkul expiră într-o oră.
        </p>
        <button
          type="button"
          onClick={() => setSent(false)}
          className="mt-4 text-xs text-neutral-500 underline underline-offset-2 hover:text-neutral-900"
        >
          Trimite din nou
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-neutral-900">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={pending}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "email-error" : undefined}
          placeholder="nume@brand.ro"
          className="mt-1.5 block w-full rounded-md border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 shadow-sm outline-none placeholder:text-neutral-400 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 disabled:bg-neutral-50 disabled:text-neutral-500"
        />
        {error && (
          <p id="email-error" className="mt-1.5 text-sm text-red-600">
            {error}
          </p>
        )}
      </div>
      <button
        type="submit"
        disabled={pending}
        className="inline-flex w-full items-center justify-center rounded-md bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Se trimite..." : "Trimite linkul de conectare"}
      </button>
    </form>
  );
}
