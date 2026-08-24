# BrightNest Cleaning UK — Hosting, Domain aur Backend Setup Guide

**Document language:** Roman Urdu  
**Project:** BrightNest Cleaning UK  
**Frontend:** React 19 + Vite + Tailwind 4  
**Frontend hosting:** Vercel  
**Backend:** FastAPI + Uvicorn  
**Backend hosting:** Railway  
**Database:** Neon PostgreSQL  
**Email:** Brevo SMTP  
**Current frontend URL:** `https://brightnestcleaning.vercel.app`  
**Current backend URL:** `https://brightnestcleaning-production.up.railway.app`

> **Important security rule:** Real `DATABASE_URL`, `JWT_SECRET`, admin password, SMTP password/key aur kisi bhi private credential ko GitHub, ZIP, frontend code, screenshot ya public document mein kabhi commit na karein.

---

## 1. Abhi project mein kya setup hai?

BrightNest ka frontend Vercel par deploy hota hai aur backend alag FastAPI service ke taur par Railway par run hota hai. Neon PostgreSQL production database hai. Frontend customer booking form se backend ke REST APIs ko request bhejta hai. Backend booking save karta hai, availability check karta hai, admin/customer authentication handle karta hai aur email notifications send karta hai.

Frontend mein API URL public environment variable ke zariye set hota hai:

```text
VITE_API_BASE_URL=https://brightnestcleaning-production.up.railway.app
```

Is value ke end par `/api/v1` add nahi karna. Frontend internally `/api/v1` path add karta hai.

---

## 2. Project ko local computer par chalana

### Frontend local setup

Node.js 20 ya newer aur pnpm install hona chahiye. Project folder mein terminal open karke yeh commands run karein:

```bash
pnpm install
pnpm run check
pnpm run dev
```

Local frontend normally is URL par open hoga:

```text
http://localhost:3000
```

Agar local frontend ko deployed Railway backend se connect karna ho, to frontend root mein `.env.local` banayein:

```env
VITE_API_BASE_URL=https://brightnestcleaning-production.up.railway.app
```

`.env.local` ko GitHub par push na karein.

### Backend local setup

Python 3.12 recommended hai. Backend directory mein jaakar virtual environment banayein:

```bash
cd backend
python -m venv .venv
```

Linux/macOS par activate karein:

```bash
source .venv/bin/activate
```

Windows PowerShell par:

```powershell
.venv\Scripts\Activate.ps1
```

Dependencies install karein:

```bash
pip install -r requirements.txt
```

`backend/.env` banayein aur safe template se values fill karein. Local server run karein:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8080
```

Health check:

```text
http://localhost:8080/health
```

Expected response:

```json
{"status":"ok","service":"brightnest-api"}
```

---

## 3. Neon database setup

Neon dashboard mein project open karein aur **Connect** button se PostgreSQL connection string copy karein. Railway mein yeh value `DATABASE_URL` ke naam se add hogi.

Example format, sirf format samajhne ke liye:

```text
postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require&channel_binding=require
```

Actual password ko is document ya GitHub mein paste na karein. Neon SSL/TLS connections enforce karta hai, isliye connection string mein SSL option rehna chahiye. Neon ki security guidance highest verification ke liye `sslmode=verify-full` recommend karti hai; project ka current deployment Neon-provided secure URL ke saath configured hai. [3]

### Migration kaise chalti hai?

Railway startup script deployment ke start par Alembic migrations chalata hai aur uske baad Uvicorn start karta hai. Is wajah se tables aur latest schema migrations automatically apply hoti hain, lekin deployment logs ko zaroor check karein.

Local migration run karne ke liye:

```bash
cd backend
alembic upgrade head
```

Production database par destructive SQL, `DROP TABLE`, `TRUNCATE` ya reset command bina backup/confirmation ke run na karein.

---

## 4. Railway backend deploy karna

### Railway service create karna

1. Railway dashboard open karein.
2. **New Project** select karein.
3. **Deploy from GitHub repo** choose karein.
4. Repository `muhammaduzair56/BrightnestCleaning-` select karein.
5. Branch `main` select karein.
6. Service settings mein **Root Directory** ko `backend` set karein.
7. Railway ko `backend/Dockerfile`, `railway.json` ya startup configuration detect karne dein.
8. Networking mein **Generate Domain** click karein.

Backend ka public health URL is format mein hoga:

```text
https://YOUR-RAILWAY-DOMAIN.up.railway.app/health
```

Railway par variables add/update karne ke baad changes staged ho sakti hain. Variables save karne ke baad deployment ko review karke deploy karein. Railway variables build process aur running service dono ko available hoti hain. [2]

### Railway required variables

In variables ko **Service → Variables** mein add karein. Sensitive values ko masked/sealed rakhein.

| Variable | Value | Zaroori? |
|---|---|---:|
| `APP_ENV` | `production` | Haan |
| `DATABASE_URL` | Neon PostgreSQL secure URL | Haan |
| `JWT_SECRET` | Random 32+ character secret | Haan |
| `ADMIN_NOTIFICATION_EMAIL` | `brightnestcleaninguk@gmail.com` | Haan |
| `EMAIL_FROM` | `BrightNest Cleaning UK <brightnestcleaninguk@gmail.com>` ya verified sender | Haan |
| `FRONTEND_BASE_URL` | `https://brightnestcleaning.vercel.app` | Haan |
| `ALLOWED_ORIGINS` | `https://brightnestcleaning.vercel.app` | Haan |
| `TRUSTED_HOSTS` | Exact Railway public hostname | Haan |
| `BOOTSTRAP_ADMIN_EMAIL` | Private admin email | Initial setup |
| `BOOTSTRAP_ADMIN_PASSWORD` | Strong unique admin password | Initial setup |
| `CUSTOMER_MAGIC_LINK_MINUTES` | `30` | Recommended |
| `ACCESS_TOKEN_MINUTES` | `30` ya project policy ke mutabiq | Recommended |
| `REFRESH_TOKEN_DAYS` | `14` ya project policy ke mutabiq | Recommended |
| `JWT_ALGORITHM` | `HS256` | Recommended |
| `COVERAGE_POSTCODE_PREFIXES` | Sirf actual covered prefixes, example `B6,B7,B8` | Business decision |
| `BOOKING_SLOT_CAPACITY` | Business capacity, example `1` | Business decision |
| `SMTP_HOST` | Brevo SMTP host | Email ke liye |
| `SMTP_PORT` | `2525` ya configured fallback | Email ke liye |
| `SMTP_USERNAME` | Brevo SMTP login | Email ke liye |
| `SMTP_PASSWORD` | Brevo SMTP password/key | Email ke liye |
| `SMTP_USE_TLS` | `true` | Email ke liye |
| `SMTP_TIMEOUT_SECONDS` | `15` | Recommended |
| `REDIS_URL` | TLS Redis URL | Optional |
| `ENABLE_DOCS` | `false` | Production recommended |
| `LOG_LEVEL` | `INFO` | Recommended |

Railway ka `PORT` variable platform khud provide karta hai. Isay normally manually add na karein. `TRUSTED_HOSTS` mein internal Railway domain ke bajaye public hostname use karein, example:

```text
brightnestcleaning-production.up.railway.app
```

Agar multiple hosts allow karne hon to project ke config format ke mutabiq comma-separated values use karein. Exact hostname Railway ke **Networking** panel se copy karein.

### Admin bootstrap

Pehli successful deployment par `BOOTSTRAP_ADMIN_EMAIL` aur `BOOTSTRAP_ADMIN_PASSWORD` se initial admin create hota hai. Admin login confirm hone ke baad bootstrap password ko rotate/remove karna safer hai, agar project configuration is workflow ko support karti ho.

Admin URL:

```text
https://brightnestcleaning.vercel.app/admin
```

Admin API credentials kabhi frontend variable, GitHub file ya public screenshot mein na rakhein.

---

## 5. Vercel frontend deploy karna

1. Vercel dashboard mein BrightNest project open karein.
2. **Settings → Git** mein confirm karein ke repository `muhammaduzair56/BrightnestCleaning-` aur branch `main` connected hai.
3. **Settings → Environment Variables** open karein.
4. `VITE_API_BASE_URL` add karein.
5. Is variable ko **Production** environment ke liye enable karein.
6. Value mein sirf backend base URL dein:

```text
https://brightnestcleaning-production.up.railway.app
```

7. Save karein.
8. Latest GitHub commit par deployment trigger karein ya **Deployments → Redeploy** click karein.
9. Agar old UI/assets nazar aayein to **Use existing Build Cache** off karke redeploy karein.
10. Live page par `Ctrl + Shift + R` ya mobile par private/incognito tab se verify karein.

Vercel SPA routes ke liye project mein fallback configuration maujood hai, isliye `/blog`, `/dashboard`, `/admin`, `/privacy-policy` aur `/terms-of-service` direct open karke test karein.

---

## 6. Custom domain lena aur Vercel par connect karna

Aap do tareeqon se domain le sakte hain:

### Option A — Vercel se domain lena

Vercel dashboard mein project open karein, phir **Settings → Domains → Add Domain** par jaayein. Agar domain available ho to Vercel se purchase karna simple option hai. Vercel ke mutabiq Vercel se kharide gaye domain ke nameservers automatically configure ho sakte hain, isliye alag DNS records manually set karne ki zaroorat nahi pad sakti. [1]

### Option B — Domain registrar se domain lena

Aap Namecheap, Cloudflare Registrar, GoDaddy ya kisi UK registrar se domain le sakte hain. Domain purchase ke baad:

1. Vercel project ke **Settings → Domains** mein domain add karein, example `brightnestcleaning.co.uk`.
2. Vercel jo DNS records show kare unhein copy karein.
3. Registrar ke DNS panel mein records add karein.
4. Apex/root domain ke liye Vercel aam tor par **A record** deta hai.
5. `www` ke liye Vercel aam tor par **CNAME record** deta hai.
6. Existing conflicting A, AAAA ya CNAME records remove karein, lekin email records jaise MX, SPF, DKIM ko bina samjhe delete na karein.
7. Vercel dashboard mein **Verify** ya refresh karein.
8. Verification ke baad primary domain select karein.
9. `www` se root ya root se `www` par redirect policy choose karein.

Vercel apex domain ke liye A record aur subdomain ke liye CNAME record use karta hai. Exact values dashboard se hi copy karein; hard-coded old values par depend na karein. [1]

### Suggested domain structure

| Purpose | Example |
|---|---|
| Main website | `brightnestcleaning.co.uk` |
| WWW redirect | `www.brightnestcleaning.co.uk` |
| Backend API, optional | `api.brightnestcleaning.co.uk` |
| Admin | `brightnestcleaning.co.uk/admin` |
| Customer dashboard | `brightnestcleaning.co.uk/dashboard` |

### Domain connect hone ke baad required changes

Agar aap `brightnestcleaning.co.uk` ko primary frontend domain banate hain to Railway variables update karein:

```env
FRONTEND_BASE_URL=https://brightnestcleaning.co.uk
ALLOWED_ORIGINS=https://brightnestcleaning.co.uk,https://www.brightnestcleaning.co.uk
```

Vercel mein frontend API variable same rahega agar backend Railway URL par hai:

```env
VITE_API_BASE_URL=https://brightnestcleaning-production.up.railway.app
```

Agar Railway par custom API domain bhi connect karein, to Vercel variable ko new API domain par update karein:

```env
VITE_API_BASE_URL=https://api.brightnestcleaning.co.uk
```

Domain change ke baad frontend aur backend dono redeploy karein. Customer magic links mein new frontend URL use ho raha hai ya nahi, zaroor test karein.

> **Warning:** Nameservers change karte waqt existing DNS records, email MX records, SPF, DKIM aur DMARC ka record zaroor preserve karein. Galat DNS change se company email temporarily band ho sakti hai. Vercel bhi nameserver method use karte waqt previous DNS records ko dobara add karne ki warning deta hai. [1]

---

## 7. Backend ko custom API domain dena — optional

Railway ka generated HTTPS domain testing aur initial launch ke liye enough hai. Custom API domain optional hai. Agar aap `api.brightnestcleaning.co.uk` chahte hain:

1. Railway service ke **Networking** panel mein **Custom Domain** add karein.
2. Railway jo CNAME target de, usay copy karein.
3. Domain registrar ke DNS panel mein `api` naam ka CNAME add karein.
4. Railway verification complete hone ka wait karein.
5. HTTPS certificate status active hone ke baad backend health URL test karein.
6. Vercel mein `VITE_API_BASE_URL` ko custom API domain par update karein.
7. Railway mein `TRUSTED_HOSTS` aur CORS variables update karein.
8. Frontend redeploy karein.

Backend custom domain ke liye apex A record khud invent na karein. Railway dashboard ka exact CNAME target use karein.

---

## 8. Production verification checklist

Deployment ke baad neeche ke tests run karein:

| Test | Expected result |
|---|---|
| Frontend homepage | Loads without blank screen |
| `/blog` | Blog index opens directly |
| Blog article | Images, text aur share buttons work |
| `/privacy-policy` | Legal page opens |
| `/terms-of-service` | Cancellation/refund section visible |
| `/health` | JSON status `ok` return ho |
| Booking form | Validation aur consent work kare |
| Availability | Past/full slots correctly blocked hon |
| Test booking | API 201 response aur database record |
| Admin login | JWT login successful |
| Admin dashboard | Booking, analytics aur change requests load |
| Customer magic link | Real booking email par link delivered |
| Receipt | Completed booking ke liye PDF download |
| Email | Customer aur admin notifications delivered |
| Mobile | 375px par no horizontal overflow |
| Desktop | 100% zoom par no unwanted overflow |
| Domain HTTPS | Browser certificate warning na ho |

Real customer email addresses par test notifications bhejne se pehle consent aur mailbox access confirm karein. Test bookings ko production database mein random dummy customer data ke saath leave na karein; test records ko admin workflow ke mutabiq identify aur remove karein.

---

## 9. Common errors aur unka solution

### Frontend blank screen ya 404

Vercel deployment ka **Root Directory**, build command aur SPA fallback check karein. Vercel par latest `main` commit deploy hua hai ya nahi, Deployments panel mein confirm karein.

### Booking request fail

Vercel Production Environment Variables mein `VITE_API_BASE_URL` check karein. Value ke end par `/api/v1` add na karein. Railway `/health` URL ko browser se open karke service status check karein.

### CORS error

Railway mein `ALLOWED_ORIGINS` mein exact frontend origin add karein, including `https://` aur without trailing slash. Custom domain add hone ke baad old Vercel domain aur new production domain dono temporarily allow kar sakte hain.

### Trusted host error

`TRUSTED_HOSTS` mein Railway ka exact public hostname add karein. `railway.internal` private hostname ko public browser/API origin ki jagah use na karein.

### Database password authentication error

Neon se latest connection string copy karein. Password reset ke baad purani `DATABASE_URL` Railway variable mein replace karein. Extra quotes, line breaks ya missing URL-encoded characters check karein. Variable save karne ke baad redeploy karein.

### Healthcheck fail

Railway logs mein startup command, migrations, port aur Uvicorn binding check karein. App ko `0.0.0.0` par Railway ke supplied `PORT` par listen karna chahiye. `/health` route ko exact path par set karein.

### Email deliver nahi hoti

Brevo SMTP host, username, password, TLS aur port check karein. Port `2525` fallback available rakhein. `EMAIL_FROM` valid email format mein ho, example:

```text
BrightNest Cleaning UK <brightnestcleaninguk@gmail.com>
```

### Custom domain verify nahi hota

Registrar DNS mein conflicting records remove karein, Vercel/Railway ka exact record copy karein, propagation ka wait karein, aur Vercel/Railway status refresh karein. Email MX/SPF/DKIM records ko delete na karein.

---

## 10. Security aur maintenance rules

Production secrets sirf Railway/Vercel secret variables ya private password manager mein rakhein. `.env`, `.env.local`, `.env.production`, database dumps, admin passwords aur SMTP credentials ko `.gitignore` mein rakhein. Agar credential accidentally GitHub par push ho jaye to sirf file delete karna enough nahi hota; credential immediately rotate/revoke karein.

Admin password unique rakhein aur shared chat mein na bhejein. JWT secret change karne se existing tokens invalidate ho sakte hain, isliye maintenance window mein rotate karein. Neon database ke backups/branching aur Railway deployment history ko regularly review karein.

Stripe abhi integrated nahi hai. Current system payment metadata, quote, tax aur payment status store kar sakta hai, lekin card payment automatically collect nahi karta. Online payment add karne se pehle Stripe Checkout, webhook signature verification, refund workflow aur PCI-safe handling implement karni hogi.

Redis optional hai. Low-volume operation mein application fallback available hai, lekin multiple backend replicas ya high traffic par managed TLS Redis add karna behtar hoga.

---

## 11. Future features jo production ke baad add ho sakte hain

Practical next upgrades mein Stripe deposit/payment flow, SMS reminders, live Google Reviews/Trustpilot links, postcode coverage management UI, referral codes, recurring booking scheduler, admin audit log viewer, GDPR export/delete workflow UI, image/content CMS aur automated uptime monitoring shamil hain. Har growth feature ko real business rules aur privacy requirements ke saath implement karein.

---

## 12. Final launch order

Recommended order yeh hai:

1. Neon connection string aur migrations verify karein.
2. Railway backend deploy karke `/health` test karein.
3. Railway variables, CORS, trusted hosts aur email configuration verify karein.
4. Vercel mein `VITE_API_BASE_URL` set karein.
5. Vercel frontend redeploy karein.
6. Booking, admin login, magic link aur email notification test karein.
7. Domain purchase karein.
8. Vercel mein custom domain add karke DNS verify karein.
9. New domain ko `FRONTEND_BASE_URL` aur `ALLOWED_ORIGINS` mein update karein.
10. Frontend/backend redeploy karke HTTPS, booking aur magic-link URLs test karein.
11. Final mobile, desktop, SEO aur accessibility smoke test karein.

---

## References

[1]: https://vercel.com/docs/domains/working-with-domains/add-a-domain "Vercel — Adding & Configuring a Custom Domain"

[2]: https://docs.railway.com/variables "Railway — Using Variables"

[3]: https://neon.com/docs/connect/connect-securely "Neon — Connect to Neon securely"

