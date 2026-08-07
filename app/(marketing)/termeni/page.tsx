import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Termeni și condiții — suntcastigator.ro",
};

// NOTE: Textul legal NU este generat automat. Secțiunile de mai jos sunt
// structura paginii; conținutul juridic efectiv este furnizat de un avocat /
// de client și înlocuiește marcajele [DE COMPLETAT]. Vezi CLAUDE.md (regula 7).
const SECTIONS: { heading: string }[] = [
  { heading: "1. Definiții" },
  { heading: "2. Organizatorul platformei" },
  { heading: "3. Obiectul și utilizarea platformei" },
  { heading: "4. Condiții de participare la campanii" },
  { heading: "5. Coduri promoționale și înscrieri" },
  { heading: "6. Premii, extrageri și acordarea premiilor" },
  { heading: "7. Obligații fiscale" },
  { heading: "8. Răspundere și limitări" },
  { heading: "9. Proprietate intelectuală" },
  { heading: "10. Modificarea termenilor" },
  { heading: "11. Legea aplicabilă și soluționarea litigiilor" },
  { heading: "12. Contact" },
];

export default function TermeniPage() {
  return (
    <main className="app-canvas min-h-screen px-4 py-10 sm:py-14">
      <article className="mx-auto w-full max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
          Termeni și condiții
        </h1>
        <p className="mt-2 text-sm text-neutral-500">
          Ultima actualizare: [DE COMPLETAT]
        </p>

        <div className="mt-6 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Conținutul juridic al acestei pagini este în curs de redactare de
          către un consilier juridic. Secțiunile marcate cu{" "}
          <span className="font-mono font-medium">[DE COMPLETAT]</span> vor fi
          completate înainte de lansare.
        </div>

        <div className="mt-8 space-y-8">
          {SECTIONS.map((section) => (
            <section key={section.heading}>
              <h2 className="text-base font-semibold text-neutral-900">
                {section.heading}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-neutral-600">
                [DE COMPLETAT]
              </p>
            </section>
          ))}
        </div>

        <footer className="mt-12 border-t border-neutral-200 pt-6 text-sm text-neutral-500">
          <Link
            href="/confidentialitate"
            className="underline underline-offset-2 hover:text-neutral-900"
          >
            Politica de confidențialitate
          </Link>
        </footer>
      </article>
    </main>
  );
}
