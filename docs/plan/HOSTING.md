# Hosting — analiză și plan de migrare

## Situația actuală

`suntcastigator.ro` e servit de **GitHub Pages** (repo-ul acesta: `index.html` + `CNAME`). GitHub Pages e exclusiv static: fără cod pe server, fără bază de date, fără secrete. Perfect pentru pagina „În construcție", **imposibil pentru platformă** (auth, Postgres, upload PDF, endpoint public de înscrieri).

**Subdomeniu de testare (deja live):** `test.suntcastigator.ro` → Vercel, pointează la aplicația Next.js reală (auth, dashboard). Există separat de apex ca să nu deranjeze placeholder-ul de pe GitHub Pages înainte de cutover. Config Supabase Auth necesar (SMTP + Redirect URLs) e documentat în [DEPLOY.md](DEPLOY.md#troubleshooting).

## Recomandare: Vercel + Supabase

| | De ce |
|---|---|
| **Vercel** | Hosting nativ Next.js (route handlers, server components), preview deployment per branch, domeniu custom + TLS gratuit, zero ops. |
| **Supabase** | Postgres + Row Level Security, Auth cu magic link (exact cerința din PDF), Storage S3-compatible pentru PDF-urile de regulament. Înlocuiește complet backend-ul separat din PDF. |

Aliniat cu `CLAUDE.md` (stack declarat) și cu PDF-ul („evită infrastructură complexă la acest stadiu"; Vercel e prima opțiune listată acolo).

### Costuri și praguri

| Fază | Vercel | Supabase | Total |
|---|---|---|---|
| Dezvoltare | Hobby — 0 | Free — 0 | **0** |
| Producție (primul client) | Pro — $20/lună | Pro — $25/lună | **~$45/lună (~€41)** |

**De ce nu rămâi pe gratuit în producție:**
- Vercel **Hobby interzice uzul comercial** (ToS) — la primul client plătitor treci pe Pro.
- Supabase Free **pune proiectul pe pauză după ~7 zile fără trafic** și are 500 MB DB, fără backup-uri automate — inacceptabil cu o campanie live. Pro include backup-uri zilnice.

### Migrarea domeniului (zero downtime)

1. Dezvoltare pe URL-ul de preview Vercel; GitHub Pages rămâne live neatins.
2. Când scaffold-ul cu landing-ul portat e verde pe Vercel: adaugă domeniul în Vercel → Settings → Domains.
3. La registrarul .ro: apex `A → 76.76.21.21`, `www` `CNAME → cname.vercel-dns.com` (Vercel afișează valorile exacte la adăugarea domeniului).
4. După propagare (verifici cu `nslookup suntcastigator.ro`): dezactivezi GitHub Pages din Settings-ul repo-ului. `CNAME` și `index.html` pot fi șterse ulterior.

## Alternative evaluate (respinse pentru MVP)

| Opțiune | Verdict |
|---|---|
| **Railway / Render** (menționate în PDF) | Au sens doar cu backend separat (Node/FastAPI) — piese și taskuri în plus fără beneficiu la acest volum. $5–20/lună. De reevaluat dacă apare vreodată nevoie de worker-e long-running. |
| **Cloudflare Pages/Workers** | Ieftin, dar Next.js pe Cloudflare are fricțiuni (adapter, limitări runtime) și diverge de stack-ul din CLAUDE.md. |
| **VPS (Hetzner) + Coolify** | €5–10/lună, cel mai ieftin la scară, dar ops manual (backup, TLS, patching) — contra filozofiei din playbook la stadiul ăsta. |
| **GitHub Pages** | Rămâne doar până la cutover; nu poate găzdui produsul. |

## Storage pentru regulamente (detaliu)

PDF-ul sugerează Cloudflare R2. La MVP folosim **Supabase Storage** (deja în stack, un vendor mai puțin, gratuit până la 1 GB — un regulament are ~100 KB). R2 devine relevant doar la volume mari sau dacă costurile de egress cresc — swap trivial, ambele sunt S3-compatible.
