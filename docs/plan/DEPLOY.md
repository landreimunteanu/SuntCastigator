# Vercel Deploy + DNS Cutover — Runbook

Acest document explică pașii pentru operatorul care va:
1. Crea proiectul SuntCastigator pe Vercel
2. Verifica că rulează pe URL-ul de preview
3. Declanșa cutover-ul domeniului (doar când produsul e gata pentru producție)
4. Retrage GitHub Pages

**Operator:** urmează pașii conform secțiunilor de mai jos. Dacă ceva nu merge, consultă secțiunea de Troubleshooting din fiecare parte.

---

## Precondiții

Înainte de a începe:

- [ ] T0.1 (Next.js scaffold) este terminat și pe branch-ul `main`.
- [ ] Repository-ul `suntcastigator` este pe GitHub (public sau private, dar accessible de tine).
- [ ] `pnpm build` funcționează local (fără erori).
- [ ] Supabase project este creat (pentru Milestone T0.2, dar nu trebuie să fie conectat acum).
- [ ] Fișierul `.env.local` conține `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, și `SUPABASE_SERVICE_ROLE_KEY` (valorile vor fi setate mai târziu în Vercel).

---

## Partea 1 — Setup Vercel Project

### 1.1 Cont Vercel și login cu GitHub

1. Mergi la https://vercel.com
2. Click butonul **Sign Up** (dreapta sus)
3. Selectează **Continue with GitHub**
4. Autorizează Vercel să acceseze contul tău GitHub (buton **Authorize Vercel** pe ecranul GitHub)
5. După autorizare, ești redirecționat la Dashboard-ul Vercel

### 1.2 Importa repository-ul

1. Pe Dashboard Vercel, click butonul **Add New...** (sus, stânga) → **Project**
2. Apare lista de repository-uri GitHub. Găsește și click pe `suntcastigator`
3. Vercel detectează automat că e un Next.js project (framework preset = **Next.js**)

### 1.3 Configură setările build și variabilele de mediu

După ce ai selectat repository-ul, apare pagina **Import Project**. Verifică:

**Root directory:**
- Lasă gol (default = repo root) — e corect

**Build Command:**
- Vercel sugerează `npm run build` — **SCHIMBĂ la `pnpm build`** (proiectul folosește pnpm)

**Install Command:**
- Vercel sugerează `npm install` — **SCHIMBĂ la `pnpm install`**

**Output Directory:**
- Lasă gol (default = `.next`) — e corect

**Node.js Version:**
- Lasă default (Vercel folosește versiunea LTS curentă) — e OK pentru MVP

### 1.4 Setează variabilele de mediu (Environment Variables)

Sub secțiunea **Environment Variables**:

Adaugă următoarele 3 variabile **fără valorile reale** (operatorul le va completa din Supabase):

| Nume | Valoare (compleți mai târziu) | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Din Supabase → Settings → API — câmpul "Project URL" | Public — OK în browser |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Din Supabase → Settings → API Keys — cheia **publishable** (format `sb_publishable_…`; înlocuiește vechiul `anon` key) | Public — OK în browser |
| `SUPABASE_SERVICE_ROLE_KEY` | Din Supabase → Settings → API Keys — cheia **secret** (format `sb_secret_…`; înlocuiește vechiul `service_role` key) | Secret — server-only, NU o pune vreodată în cod client |

**Unde să găsești valorile exacte:**
1. Mergi la https://app.supabase.com → selectează proiectul SuntCastigator
2. Stânga, click **Settings** → **API** (pentru URL) și **Settings** → **API Keys** (pentru chei)
3. Copiază:
   - **Project URL:** de sub secțiunea "Project URL" din tab-ul API
   - **Publishable key** (format `sb_publishable_…`): de sub tab-ul API Keys → coloana "Publishable" — vizibilă direct
   - **Secret key** (format `sb_secret_…`): de sub tab-ul API Keys → coloana "Secret" — click **Reveal** pentru a o dezvălui
4. Paste fiecare valoare în Vercel, în câmpurile corespunzătoare

### 1.5 Deploy

1. Click butonul **Deploy** (jos, pe pagina de Import)
2. Vercel va rula build-ul, install-ul dependențelor, și va deploye
3. După 1–2 minute, apare o pagină cu titlu **🎉 Congratulations!** și URL-ul deployed

**Copiază URL-ul de preview** (format: `https://[random-name].vercel.app`) — o să-l teste mai jos.

---

## Partea 2 — Verificare pe Preview URL

### 2.1 Test în browser

1. Deschide URL-ul de preview copiat mai sus în browser
2. Ar trebui să se încarce pagina **"În construcție"** identic cu `index.html` original (gradient, card, titlu, trofeu, logo-uri, copyright cu anul curent)

**Dacă nu se încarcă:**
- Merge la Vercel → Project `suntcastigator` → **Deployments** (tab-ul al doilea)
- Click pe deployment-ul cel mai recent
- Scroll jos la **Logs** și caută mesajele de eroare (roșu)
- Erori comune: build command greșit, variabilele de mediu incomplete
- Dacă e `pnpm: command not found`, Vercel nu a folosit `pnpm install` — revino la 1.4 și asigură-te că ai salvat `pnpm install` ca Install Command

### 2.2 Test endpoint-ului `/api/health`

1. Deschide un terminal pe mașina ta
2. Rulează:
   ```bash
   curl https://[preview-url]/api/health
   ```
   (înlocuiește `[preview-url]` cu URL-ul copiat)

3. Trebuie să primești răspuns:
   ```
   {"ok":true}
   ```
   cu status HTTP 200

**Dacă primești 404 sau altă eroare:**
- La Vercel → Deployments → Logs, caută erori în seqiunea "Build" sau "Runtime"
- Asigură-te că fișierul `app/api/health/route.ts` există și exportă o funcție `GET`

### 2.3 Verifică că `.env.local` nu e commit-at

1. Rulează local:
   ```bash
   git status
   ```
2. Confirma că `.env.local` NU apare în lista (trebuie să fie în `.gitignore`)

---

## Partea 3 — DNS Cutover (Doar când produsul e gata)

**⚠️ Atenție:** Acest pas se execută **NUMAI după ce platform-a (dashboard + pagina consumator) e verificată și gata pentru producție**. Nu o face înainte — GitHub Pages va cădea.

### 3.1 Adaugă domeniul în Vercel (dacă nu e adăugat deja)

1. Vercel → Project `suntcastigator` → **Settings**
2. Tab-ul **Domains** (stânga)
3. Click **Add Domain** (dreapta sus)
4. Type `suntcastigator.ro` (fără `www`) și press Enter
5. Vercel afișează instrucțiunile DNS:
   - **Root/Apex (`@`):** `A record → 76.76.21.21`
   - **www subdomain:** `CNAME record → cname.vercel-dns.com`

(Valorile finale nu se schimbă — sunt acelea din `docs/plan/HOSTING.md`. Vercel doar confirma că sunt corecte.)

### 3.2 Update DNS-ul la registrarul .ro

**Registrarul:** Unde ai .ro domain-ul (RoTLD, reseller, sau platform cum ar fi Namecheap, GoDaddy etc.).

Paști la registrar și caută secțiunea **DNS Records** sau **Zone File**:

1. **Apex record (`@` sau rădăcina domeniului):**
   - Type: `A`
   - Value: `76.76.21.21`
   - (Șterge orice record `A` vechi care puncta spre GitHub Pages — de obicei `185.199.108.153`)

2. **Subdomain `www`:**
   - Type: `CNAME`
   - Value: `cname.vercel-dns.com`
   - (Șterge orice record `CNAME` vechi care puncta spre GitHub Pages — de obicei `[username].github.io`)

**Exemplu (RoTLD web interface):**
```
suntcastigator.ro.  3600  IN  A  76.76.21.21
www.suntcastigator.ro. 3600  IN  CNAME  cname.vercel-dns.com.
```

3. Salveaza schimbările (buton **Save** / **Apply**)

### 3.3 Verificare propagare DNS

După ce ai updatat DNS-ul la registrar, se propagă în cca. 30 minute–24 ore (de obicei 5–15 min).

Verifică folosind `nslookup` (terminal):

```bash
nslookup suntcastigator.ro
nslookup www.suntcastigator.ro
```

**Răspunsuri corecte:**

```
> nslookup suntcastigator.ro
Server: [DNS server]
Address: [IP]

Non-authoritative answer:
Name: suntcastigator.ro
Address: 76.76.21.21
```

```
> nslookup www.suntcastigator.ro
Server: [DNS server]
Address: [IP]

Non-authoritative answer:
Name: www.suntcastigator.ro
canonical name = cname.vercel-dns.com
[...]
Address: 76.76.21.21
```

**Dacă încă apare IP-ul vechi (185.199.108.xxx):**
- Propagarea nu e completă — asteaptă 5–10 minute și reîncearcă
- Sau șterge cached DNS local:
  ```bash
  ipconfig /flushdns  # Windows
  sudo dscacheutil -flushcache  # macOS
  sudo systemctl restart nscd  # Linux
  ```

### 3.4 TLS Certificate

După propagare, Vercel emite automat un certificat TLS gratuit pentru `suntcastigator.ro` și `www.suntcastigator.ro`. Poți vedea status-ul:

- Vercel → Project → Settings → Domains
- Lângă fiecare domeniu ar trebui scris **Verified** (verde) și **Valid Certificate** (verde)

---

## Partea 4 — Retragere GitHub Pages

**Avert:** Executa DOAR după ce:
1. DNS propagation se vede cu `nslookup`
2. `https://suntcastigator.ro` și `https://www.suntcastigator.ro` deschid pagina Vercel (nu GitHub Pages)
3. Ai avut ~1–2 ore de trafic pe Vercel fără probleme

### 4.1 Dezactivează GitHub Pages

1. GitHub → Repository `suntcastigator` → **Settings** (tab-ul dreapta sus)
2. Stânga, click **Pages**
3. Sub **Source**, schimbă de la "Deploy from a branch" la **None**
4. Salveaza (click Save dacă e prompt)

### 4.2 Cleanup — Șterge fișierele de GitHub Pages (Opțional, după 1 săptămână)

După ce site-ul funcționează bine pe Vercel o săptămână:

1. Git: șterge din repo fișierele:
   ```bash
   git rm index.html CNAME
   git commit -m "remove github pages artifacts after vercel cutover"
   git push
   ```

2. (Alternativ, dacă vrei să păstrezi ca safety net, lasă fișierele — nu fac rău și pot fi oricând restaurate.)

---

## Troubleshooting

### Deployment eșueaza cu eroare "Cannot find module"

**Cauze posibile:**
1. `pnpm install` nu a fost folosit — check că în Vercel Settings "Install Command" e exact `pnpm install`
2. Dependență nouă adăugată local dar `pnpm-lock.yaml` nu e commit-at

**Fix:** Commit-ează `pnpm-lock.yaml` dacă nu e deja:
```bash
git add pnpm-lock.yaml
git commit -m "add pnpm lockfile"
git push
```
După push, Vercel va retry automat.

### `/api/health` returnează 404

**Cauze posibile:**
1. Fișierul `app/api/health/route.ts` lipsește
2. Funcția `export async function GET()` nu e definită

**Verificare:**
```bash
ls -la app/api/health/route.ts
```

Trebuie să existe. Dacă nu, task-ul T0.2 nu a fost finalizat — revino la documentația task-ului.

### nslookup încă arată IP-ul vechi (185.199.108.xxx)

**Cauze posibile:**
1. Recordurile DNS la registrar nu au fost salvate corect
2. Propagarea în curs — timerul de ~24 ore

**Pași:**
1. Verifica la registrar că recordurile sunt salvate (refresh pagina, logout/login dacă trebuie)
2. Asteptă 10–15 minute
3. Flush cache local:
   - Windows: `ipconfig /flushdns`
   - macOS: `sudo dscacheutil -flushcache`
   - Linux: `sudo systemctl restart nscd`
4. Reîncearcă `nslookup`

Dacă după 1 ora încă nu merge, contact registrarul — ar putea fi timeout în salvarea DNS.

### Domeniu e pe Vercel dar `suntcastigator.ro` deschide "Cannot find server" sau GitHub Pages

**Cauze posibile:**
1. DNS nu s-a propagat (vezi troubleshooting de mai sus)
2. TLS cert nu e emis (check că Status lângă domeniu în Vercel Settings → Domains arată green)

**Fix:** Asteaptă propagare DNS + cert (cca. 30–60 min), apoi reîncearcă.

### Vrei să revii la GitHub Pages (rollback)

**Dacă ceva explodează pe Vercel după cutover:**

1. GitHub → Settings → Pages → Source: **Deploy from a branch** (selectează `main`)
2. La registrar, revert DNS:
   - Apex: `A → 185.199.108.153` (sau valoarea veche din history)
   - www: `CNAME → [username].github.io`
   - Salveaza
3. Asteaptă propagare DNS (~10–15 min)

Traficul va reveni la GitHub Pages. După fix, poți relua DNS cutover spre Vercel.

---

## Resume — Ce faci pas cu pas

| Pas | Cine | Ce |
|---|---|---|
| 1 | Operator | Creeaza cont Vercel, conectează GitHub |
| 2 | Operator | Importa suntcastigator repo; schimbă build command la `pnpm build` |
| 3 | Operator | Adaugă 3 env vars (URL + 2 keys din Supabase) |
| 4 | Operator | Deploy; copie preview URL |
| 5 | Operator | Test cu browser + `curl /api/health` |
| 6 | (Asteptă T0.2+) | Platforma dezvoltată și gata pentru producție |
| 7 | Operator | Adaugă domeniu în Vercel |
| 8 | Operator | Update DNS la registrar (A + CNAME) |
| 9 | Operator | Verifica cu `nslookup` |
| 10 | Operator | Dezactiveaza GitHub Pages |
| 11 | Operator | (După 1 săptămână) Șterge index.html + CNAME din repo |

**Gata!** `suntcastigator.ro` e live pe Vercel.
