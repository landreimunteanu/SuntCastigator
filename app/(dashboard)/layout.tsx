import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBrand } from "@/lib/supabase/get-brand";
import { signOut } from "@/lib/actions/auth";

export const dynamic = "force-dynamic";

const NAV_ITEMS = [
  { href: "/dashboard/campaigns", label: "Campanii" },
  { href: "/dashboard/entries",   label: "Înscrieri" },
  { href: "/dashboard/draw",      label: "Extragere" },
  { href: "/dashboard/reports",   label: "Rapoarte" },
  { href: "/dashboard/settings",  label: "Setări" },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  // Middleware already guards this; keep the check as belt-and-suspenders
  // in case the layout is ever rendered outside the middleware matcher.
  if (!user) redirect("/login");

  const context = await getCurrentBrand();

  if (!context) {
    return (
      <main className="mx-auto max-w-lg px-4 py-24">
        <h1 className="text-xl font-semibold text-neutral-900">
          Cont fără brand
        </h1>
        <p className="mt-3 text-sm text-neutral-600">
          Contul tău <strong>{user.email}</strong> nu este încă asociat unui
          brand. Contactează operatorul platformei pentru a fi invitat.
        </p>
        <form action={signOut} className="mt-6">
          <button
            type="submit"
            className="text-sm text-neutral-600 underline underline-offset-2 hover:text-neutral-900"
          >
            Ieșire
          </button>
        </form>
      </main>
    );
  }

  return (
    <div className="flex min-h-screen bg-white text-neutral-900">
      <aside className="flex w-56 shrink-0 flex-col border-r border-neutral-200 bg-neutral-50 px-4 py-5">
        <div className="mb-6">
          <p className="text-[10px] font-medium uppercase tracking-wider text-neutral-500">
            Brand
          </p>
          <p className="mt-1 truncate text-sm font-semibold text-neutral-900">
            {context.brand.name}
          </p>
        </div>
        <nav className="flex-1 space-y-0.5">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-md px-3 py-2 text-sm text-neutral-700 transition-colors hover:bg-neutral-200/60 hover:text-neutral-900"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-end gap-4 border-b border-neutral-200 bg-white px-6 py-3">
          <span className="text-sm text-neutral-600">{user.email}</span>
          <form action={signOut}>
            <button
              type="submit"
              className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-800 transition-colors hover:bg-neutral-50"
            >
              Ieșire
            </button>
          </form>
        </header>
        <main className="app-canvas flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
