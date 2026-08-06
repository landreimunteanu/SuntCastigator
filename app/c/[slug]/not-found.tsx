import Link from "next/link";

export default function CampaignNotFound() {
  return (
    <main className="app-canvas flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-900 text-xl text-white">
          🏆
        </div>
        <h1 className="mt-4 text-xl font-semibold text-neutral-900">
          Campania nu există
        </h1>
        <p className="mt-2 text-sm text-neutral-600">
          Linkul pe care l-ai deschis nu duce către o campanie activă. Verifică
          adresa sau contactează brandul.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center justify-center rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-800 shadow-sm hover:bg-neutral-50"
        >
          Pagina principală
        </Link>
      </div>
    </main>
  );
}
