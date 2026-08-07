import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Politica de confidențialitate — suntcastigator.ro",
};

// NOTE: Textul legal NU este generat automat. Structura de mai jos reflectă
// cerințele GDPR relevante pentru platformă (datele colectate la înscriere:
// nume, contact, IP, consimțământ). Conținutul juridic efectiv este furnizat
// de un avocat / de client și înlocuiește marcajele [DE COMPLETAT].
// Vezi CLAUDE.md (regula 7).
const SECTIONS: { heading: string }[] = [
  { heading: "1. Operatorul de date" },
  { heading: "2. Ce date colectăm" },
  { heading: "3. Scopul și temeiul legal al prelucrării" },
  { heading: "4. Consimțământul participanților" },
  { heading: "5. Perioada de stocare a datelor" },
  { heading: "6. Cui divulgăm datele" },
  { heading: "7. Drepturile tale (acces, rectificare, ștergere, portabilitate)" },
  { heading: "8. Cum îți exerciți dreptul de ștergere (dreptul de a fi uitat)" },
  { heading: "9. Securitatea datelor" },
  { heading: "10. Cookie-uri" },
  { heading: "11. Modificări ale acestei politici" },
  { heading: "12. Date de contact pentru protecția datelor" },
];

export default function ConfidentialitatePage() {
  return (
    <main className="app-canvas min-h-screen px-4 py-10 sm:py-14">
      <article className="mx-auto w-full max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
          Politica de confidențialitate
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
            href="/termeni"
            className="underline underline-offset-2 hover:text-neutral-900"
          >
            Termeni și condiții
          </Link>
        </footer>
      </article>
    </main>
  );
}
