// Powers the "Stadiu platformă" page at /dashboard/platform.
// Update this file in the same commit as any change that finishes a
// milestone task, adds user-facing functionality, or fixes a notable
// security/reliability issue — see CLAUDE.md golden rule on progress
// tracking.

export type TaskState = "done" | "in_progress" | "planned";

export type ProgressTask = {
  id: string;
  title: string;
  state: TaskState;
};

export type ProgressMilestone = {
  id: string;
  title: string;
  tasks: ProgressTask[];
};

export const PROGRESS_UPDATED_AT = "2026-08-09";

export const PROGRESS_MILESTONES: ProgressMilestone[] = [
  {
    id: "M0",
    title: "Fundație — Next.js, Supabase, schema + RLS",
    tasks: [
      { id: "T0.1", title: "Scaffold Next.js + pagina de landing", state: "done" },
      { id: "T0.2", title: "Clienți Supabase + variabile de mediu + health check", state: "done" },
      { id: "T0.3", title: "Runbook deploy Vercel + DNS", state: "done" },
      { id: "T0.4", title: "Schema v1 + RLS pe toate tabelele", state: "done" },
      { id: "T0.5", title: "Sincronizare model de date în CLAUDE.md", state: "done" },
    ],
  },
  {
    id: "M1",
    title: "Autentificare & tenanță",
    tasks: [
      { id: "T1.1", title: "Autentificare cu link magic", state: "done" },
      { id: "T1.2", title: "Shell dashboard + protecție rute + context brand", state: "done" },
      { id: "T1.3", title: "Roluri (owner/editor) + script de creare brand", state: "done" },
    ],
  },
  {
    id: "M2",
    title: "Wizard de campanie",
    tasks: [
      { id: "T2.0", title: "Shell wizard + autosave ciornă", state: "done" },
      { id: "T2.1", title: "Pas 1 — Produse eligibile (CSV + căutare)", state: "done" },
      { id: "T2.2", title: "Pas 2 — Format cod", state: "done" },
      { id: "T2.3", title: "Pas 3 — Premii + calcul impozit", state: "done" },
      { id: "T2.4", title: "Pas 4 — Date, regulament PDF, lansare", state: "done" },
      { id: "T2.5", title: "Pagina cu lista de campanii", state: "done" },
    ],
  },
  {
    id: "M3",
    title: "Pagina publică de înscriere",
    tasks: [
      { id: "T3.1", title: "Pagina publică /c/[slug]", state: "done" },
      { id: "T3.2", title: "POST /api/entries (validare + rate-limit server-side)", state: "done" },
      { id: "T3.3", title: "Stări UX în română (succes/duplicat/invalid/etc.)", state: "done" },
    ],
  },
  {
    id: "M4",
    title: "Dashboard & rapoarte",
    tasks: [
      { id: "T4.1", title: "Carduri statistici + tabel înscrieri", state: "done" },
      { id: "T4.2", title: "Grafic înscrieri pe zile", state: "done" },
      { id: "T4.3", title: "Export CSV participanți eligibili", state: "done" },
    ],
  },
  {
    id: "M5",
    title: "Extragere câștigători (auditabilă)",
    tasks: [
      { id: "T5.1", title: "Motor de extragere (reproductibil, seed + hash)", state: "done" },
      { id: "T5.2", title: "Interfață extragere + export CSV câștigători", state: "done" },
      { id: "T5.3", title: "Notificare manuală câștigători (copiere + mailto BCC)", state: "done" },
    ],
  },
  {
    id: "M6",
    title: "Hardening, legal, lansare",
    tasks: [
      { id: "T6.1", title: "Revizuire de securitate + remedieri (cross-tenant, headere, erori)", state: "done" },
      { id: "T6.2", title: "Pagini GDPR/legale + script de ștergere participant", state: "done" },
      { id: "T6.3", title: "UAT — testare completă cu un brand real (checklist pregătit, rulare manuală în așteptare)", state: "in_progress" },
      { id: "T6.4", title: "Pagină de landing de marketing reală", state: "done" },
      { id: "T6.5", title: "Audit de securitate suplimentar (injecție CSV, redirect deschis, expunere campanii ciornă, auto-înrolare eliminată) — remedierea rate-limit fail-open încă în așteptare", state: "in_progress" },
    ],
  },
];

export const CURRENT_FUNCTIONALITY: string[] = [
  "Autentificare fără parolă (link magic) și context de brand per utilizator",
  "Wizard în 4 pași pentru configurarea unei campanii, cu salvare automată a ciornei",
  "Pagină publică de înscriere cu cod, optimizată pentru mobil, cu validare completă pe server (format, duplicat, limite de rată pe IP și pe contact)",
  "Dashboard cu statistici live, tabel de înscrieri, grafic pe zile și export CSV al participanților eligibili",
  "Motor de extragere a câștigătorilor, reproductibil (seed + hash înregistrate), cu audit, export CSV și listă pregătită pentru notificare manuală",
  "Izolare completă între branduri (RLS pe toate tabelele, verificată prin teste live), fără scurgere de erori interne, headere de securitate de bază",
  "Pagini legale (Termeni și condiții, Politica de confidențialitate) cu structură pregătită pentru textul juridic, și script operator de ștergere GDPR a datelor unui participant",
];
