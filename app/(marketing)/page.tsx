// TEMPORARY testing swap — this file normally holds the "În construcție"
// public placeholder (preserved in git history, restore it before real
// launch/DNS cutover per docs/plan/DEPLOY.md). For now it points brand
// testers straight at magic-link login.
import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="app-canvas flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-900 text-xl">
          🏆
        </div>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-neutral-900">
          suntcastigator.ro
        </h1>
        <p className="mt-2 text-sm text-neutral-600">
          Mediu de testare — conectează-te ca brand.
        </p>

        <Link
          href="/login"
          className="mt-6 inline-flex w-full items-center justify-center rounded-md bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-neutral-800"
        >
          Sunt Brand — Conectare
        </Link>
      </div>
    </main>
  );
}
