import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SuntCastigator — Concursuri cu coduri pentru brandul tău",
  description:
    "Rulează concursuri „înscrie codul, câștigă un premiu” pentru brandul tău, fără agenție și fără microsite construit de la zero. Live în zile, nu săptămâni.",
};

const CONTACT_EMAIL = "contact@suntcastigator.ro";

const VALUE_PROPS = [
  {
    icon: "⚙️",
    title: "Configurare simplă",
    body: "Un wizard în 4 pași — produse eligibile, format cod, premii, regulament. Fără agenție, fără microsite construit de la zero.",
  },
  {
    icon: "🛡️",
    title: "Anti-fraudă automat",
    body: "Validare pe server a fiecărui cod, detecție de duplicate și limite de rată pe IP și pe contact. Nimic nu se bazează pe browser.",
  },
  {
    icon: "🎲",
    title: "Extragere auditabilă",
    body: "Extragere reproductibilă: seed și amprentă (hash) înregistrate, astfel încât orice câștigător poate fi verificat și în caz de dispută.",
  },
];

const STEPS = [
  {
    n: "1",
    title: "Configurezi campania",
    body: "Adaugi produsele eligibile, alegi formatul codului, definești premiile și încarci regulamentul.",
  },
  {
    n: "2",
    title: "Consumatorii înscriu codul",
    body: "O pagină publică optimizată pentru mobil, în română, fără cont — codul plus datele minime de contact.",
  },
  {
    n: "3",
    title: "Extragi câștigătorii",
    body: "Urmărești înscrierile live, rulezi extragerea auditabilă și exporți lista de câștigători.",
  },
];

export default function LandingPage() {
  const year = new Date().getFullYear();

  return (
    <main className="marketing">
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-5xl flex-col px-5 py-6 sm:px-8">
        {/* Nav */}
        <nav className="flex items-center justify-between">
          <span className="text-base font-bold tracking-tight">
            suntcastigator<span className="marketing__gold">.ro</span>
          </span>
          <Link
            href="/login"
            className="rounded-full border border-white/20 px-4 py-1.5 text-sm font-medium text-white/90 transition-colors hover:border-white/40 hover:text-white"
          >
            Sunt brand — Conectare
          </Link>
        </nav>

        {/* Hero */}
        <section className="flex flex-1 flex-col items-center justify-center py-16 text-center sm:py-24">
          <span className="mb-6 inline-block rounded-full border border-[rgba(255,212,94,0.4)] px-4 py-1.5 text-xs font-medium uppercase tracking-[0.18em] marketing__gold">
            Concursuri cu coduri
          </span>
          <h1 className="mx-auto max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl md:text-6xl">
            Concursuri cu coduri pentru brandul tău —{" "}
            <span className="marketing__gold">live în zile, nu săptămâni</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base text-white/70 sm:text-lg">
            Rulează promoții „înscrie codul, câștigă un premiu” fără să reconstruiești
            un microsite pentru fiecare campanie. Configurezi, publici, extragi
            câștigătorii — totul dintr-un singur loc.
          </p>
          <a
            href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
              "Vreau o campanie pe SuntCastigator",
            )}`}
            className="mt-9 inline-flex items-center justify-center rounded-full px-7 py-3 text-base font-semibold shadow-lg shadow-black/30 transition-transform hover:scale-[1.02] marketing__pill"
          >
            Programează o discuție
          </a>
          <p className="mt-3 text-xs text-white/50">
            Onboarding asistat — îți configurăm prima campanie împreună.
          </p>
        </section>

        {/* Value props */}
        <section className="grid gap-4 sm:grid-cols-3">
          {VALUE_PROPS.map((prop) => (
            <div
              key={prop.title}
              className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm"
            >
              <div className="text-2xl" aria-hidden>
                {prop.icon}
              </div>
              <h2 className="mt-3 text-lg font-semibold">{prop.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-white/70">
                {prop.body}
              </p>
            </div>
          ))}
        </section>

        {/* How it works */}
        <section className="mt-20">
          <h2 className="text-center text-2xl font-bold sm:text-3xl">
            Cum funcționează
          </h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            {STEPS.map((step) => (
              <div key={step.n} className="text-center sm:text-left">
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full text-lg font-bold sm:mx-0 marketing__pill">
                  {step.n}
                </div>
                <h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/70">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Closing CTA */}
        <section className="mt-20 rounded-3xl border border-white/10 bg-white/5 p-10 text-center backdrop-blur-sm">
          <h2 className="text-2xl font-bold sm:text-3xl">
            Gata să lansezi prima campanie?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-white/70 sm:text-base">
            Spune-ne despre brandul tău și îți arătăm cum arată o campanie de la
            configurare până la extragere.
          </p>
          <a
            href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
              "Vreau o campanie pe SuntCastigator",
            )}`}
            className="mt-7 inline-flex items-center justify-center rounded-full px-7 py-3 text-base font-semibold shadow-lg shadow-black/30 transition-transform hover:scale-[1.02] marketing__pill"
          >
            Scrie-ne la {CONTACT_EMAIL}
          </a>
        </section>

        {/* Footer */}
        <footer className="mt-16 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-xs text-white/50 sm:flex-row">
          <p>
            © {year} <strong className="text-white/80">suntcastigator.ro</strong>{" "}
            — Toate drepturile rezervate.
          </p>
          <div className="flex items-center gap-4">
            <Link href="/termeni" className="hover:text-white/80">
              Termeni și condiții
            </Link>
            <Link href="/confidentialitate" className="hover:text-white/80">
              Confidențialitate
            </Link>
          </div>
        </footer>
      </div>
    </main>
  );
}
