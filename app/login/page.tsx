import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LoginForm from "@/components/LoginForm";

export const dynamic = "force-dynamic";

const ERROR_MESSAGES: Record<string, string> = {
  missing_code: "Linkul de conectare este incomplet. Cere unul nou.",
  exchange_failed: "Linkul a expirat sau a fost deja folosit. Cere unul nou.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  const { error } = await searchParams;
  const errorMessage = error ? ERROR_MESSAGES[error] : null;

  return (
    <main className="app-canvas flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-900 text-xl">
            🏆
          </div>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-neutral-900">
            Conectare
          </h1>
          <p className="mt-2 text-sm text-neutral-600">
            Îți trimitem un link de conectare pe email.
          </p>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
          {errorMessage && (
            <div
              role="alert"
              className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800"
            >
              {errorMessage}
            </div>
          )}
          <LoginForm />
        </div>

        <p className="mt-6 text-center text-xs text-neutral-500">
          Nu ai cont încă? Contul se creează pe invitație — contactează
          operatorul brandului tău.
        </p>
      </div>
    </main>
  );
}
