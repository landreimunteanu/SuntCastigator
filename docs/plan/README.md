# SuntCastigator — Plan de lucru MVP

> Sursă: `claude md files/BackBoneNotion/SuntCastigator.pdf` (blueprint produs, Notion export).
> Reguli de lucru: `claude md files/AI-CODING-PLAYBOOK.md` + `claude md files/CONVENTIONS.md` + `CLAUDE.md` (root).
> Arhitectură și schemă DB: [ARCHITECTURE.md](ARCHITECTURE.md). Hosting: [HOSTING.md](HOSTING.md). Setup local (`.env.local`): [SETUP.md](SETUP.md).

## Ce construim (rezumat)

Platformă B2B2C pentru branduri românești mijlocii (FMCG/retail): concursuri „introdu codul, câștigă un premiu" fără microsite reconstruit de agenție la fiecare campanie.

**MVP Faza 1 (6–10 săptămâni):**
- **Panou brand** — wizard campanie 4 pași (produse eligibile, format cod, premii + fiscalitate, date + regulament PDF), dashboard live, export CSV.
- **Pagină consumator** — publică, mobile-first, un ecran, fără login: cod + nume + telefon/email + consimțământ GDPR.
- **Motor anti-fraudă** — rule-based: duplicat → respins, format invalid → respins, rate-limit per IP/telefon.
- **Extragere câștigători** — random cu seed înregistrat (auditabil, reproductibil, CSV cu hash de integritate).

**Exclus explicit din MVP** (nu implementa, nu propune): aplicație nativă, OCR bon fiscal, self-service onboarding branduri, fraud ML, plăți Stripe (facturare manuală la început).

**Criteriu de „gata":** un brand plătitor configurează singur o campanie, iar consumatorii se înscriu fără buguri critice.

## Stack (decis — nu se schimbă fără discuție)

Next.js App Router + TypeScript + Tailwind + shadcn/ui · Supabase (Postgres + RLS, Auth magic-link, Storage) · Vercel. Un singur app, fără backend separat. Detalii și motivare în [ARCHITECTURE.md](ARCHITECTURE.md).

## Cum se lucrează cu subagenți

1. **Un task = un agent = un commit.** Nu da unui agent mai mult de un task card.
2. Promptul agentului = conținutul task card-ului din `tasks/` + trimitere la `CLAUDE.md` și `CONVENTIONS.md`. Card-urile conțin deja: fișiere permise, spec, criterii de acceptanță, pași de verificare.
3. **Cere planul înainte de cod** (pentru orice task non-trivial) și verifică în browser după, conform AI-CODING-PLAYBOOK.
4. Orchestratorul (model puternic) revizuiește diff-ul înainte de commit. Taskurile marcate **[S]** NU se deleagă modelelor slabe.
5. Alocare pe modele: **[S]** = model puternic (schemă+RLS, endpoint public, draw engine, security review) · **[so]** = Sonnet (features) · **[h]** = Haiku (UI static, copy, stări).

## Milestones și ordinea de execuție

| Milestone | Fișier | Poate rula după | Stare |
|---|---|---|---|
| M0 Fundație (scaffold, Supabase, Vercel, schemă+RLS, CLAUDE.md) | [tasks/M0-foundation.md](tasks/M0-foundation.md) | — (secvențial) | ✅ complet |
| M1 Auth & tenancy (magic link, protecție rute, roluri) | [tasks/M1-auth.md](tasks/M1-auth.md) | T0.4 | ⏳ în lucru |
| M2 Wizard campanie (shell + 4 pași + listă) | [tasks/M2-wizard.md](tasks/M2-wizard.md) | T1.2 · pașii 1–4 în paralel după shell | — |
| M3 Pagina consumator + POST /api/entries (critică) | [tasks/M3-consumer.md](tasks/M3-consumer.md) | T0.4 (paralel cu M2 — campania de test se seedează prin SQL) | — |
| M4 Dashboard & rapoarte | [tasks/M4-dashboard.md](tasks/M4-dashboard.md) | T3.2 | — |
| M5 Extragere câștigători | [tasks/M5-draw.md](tasks/M5-draw.md) | T4.1 | — |
| M6 Hardening, GDPR, UAT, landing real | [tasks/M6-hardening.md](tasks/M6-hardening.md) | M2–M5 (T6.4 oricând) | — |

**M0 livrat (2026-08-01):** Next.js 15 + Tailwind v4 + shadcn/ui scaffold cu landing „În construcție" portat din `index.html`; clienți Supabase server/browser + `GET /api/health`; runbook Vercel + DNS cutover ([DEPLOY.md](DEPLOY.md)); migrare schemă v1 aplicată pe proiectul Supabase — 10 tabele, RLS ON peste tot, `is_brand_member()` helper, `submit_entry()` SECURITY DEFINER cu rate-limit per IP/oră + per-contact/24h, seed `settings` (600 lei prag fiscal, 20/h IP).

~26 taskuri a 0,5–2h fiecare. Drumul critic: T0.1→T0.2→T0.4→T1.1→T1.2→T2.0→T2.4 și T0.4→T3.1→T3.2.

## Faza 2 (după ~3 clienți plătitori stabili — NU acum)

Portal self-service pentru branduri, aplicație de consum multi-brand, automatizare fraudă avansată, Stripe pentru abonamente.

## Note și riscuri

- **Sursa trunchiată:** exportul PDF taie tabelul „Cerinte" la rândul „Motor" (pag. 17). Rândurile lipsă sunt acoperite de secțiunea de scope MVP (pag. 2–3). Pentru fidelitate 100%, re-exportă pagina Notion „Discount products".
- **Text legal:** regulamentul oficial NU se generează cu AI (cerință explicită în PDF). Upload PDF la MVP; șablonul DOCX cu variabile e opțional, mai târziu.
- **Fiscalitate premii:** pragul (600 lei) și cota de impozit stau în tabela `settings`, nu hardcodate — legislația se poate schimba. De validat calculul cu contabilul.
- **GDPR:** date minime, consimțământ cu timestamp, ștergere la cerere. Relația operator/împuternicit cu brandul se clarifică în contract.
