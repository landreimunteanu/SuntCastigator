import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/actions/auth";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <main className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="text-2xl font-semibold text-neutral-900">Dashboard</h1>
      <p className="mt-2 text-sm text-neutral-600">
        Ești autentificat ca <strong>{user.email}</strong>. Shell-ul complet vine în T1.2.
      </p>
      <form action={signOut} className="mt-6">
        <button
          type="submit"
          className="inline-flex items-center rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-50"
        >
          Ieșire
        </button>
      </form>
    </main>
  );
}
