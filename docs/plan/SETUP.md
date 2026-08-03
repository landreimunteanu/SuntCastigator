# Setup local — `.env.local`

Ce trebuie configurat ca să rulezi proiectul pe mașina ta (`pnpm dev`).

## Pași

1. **Copiază șablonul:**
   ```bash
   cp .env.example .env.local
   ```

2. **Ia valorile din Supabase** (cere acces la proiect dacă nu îl ai — operatorul te invită din Supabase → Project Settings → Team):
   - Mergi la https://app.supabase.com → proiectul SuntCastigator
   - **Settings → API** → câmpul "Project URL" → pune-l la `NEXT_PUBLIC_SUPABASE_URL`
   - **Settings → API Keys** → coloana **Publishable** (format `sb_publishable_…`) → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Settings → API Keys** → coloana **Secret** (format `sb_secret_…`, click **Reveal**) → `SUPABASE_SERVICE_ROLE_KEY` — completeaz-o **doar dacă** lucrezi la cod server-side care chiar are nevoie de ea (rar, la MVP); altfel las-o goală

3. **Instalează și pornește:**
   ```bash
   pnpm install
   pnpm dev
   ```
   → http://localhost:3000

## Reguli

- `.env.local` e în `.gitignore` — **nu se commite niciodată** (conține secrete reale).
- `SUPABASE_SERVICE_ROLE_KEY` e server-only. Nu apare niciodată în cod client (`"use client"`, browser JS) — vezi regulile 5–6 din `CLAUDE.md` (root).
- Dacă adaugi o variabilă nouă în `.env.example`, actualizează și acest fișier.

## Login local (magic link)

Pentru ca autentificarea să funcționeze pe `localhost:3000`, originea `http://localhost:3000/auth/callback` trebuie să fie deja în Supabase → **Authentication → URL Configuration → Redirect URLs**. Dacă lipsește, linkul de login te duce pe pagina greșită — vezi [DEPLOY.md → Troubleshooting](DEPLOY.md#troubleshooting) pentru simptome și fix.
