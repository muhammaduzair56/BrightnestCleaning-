# BrightNest API — Railway Deployment

## Purpose

This backend is ready to deploy from the public GitHub repository using Railway's Nixpacks builder. Railway reads `requirements.txt`, runs the included startup script, checks `/health`, and exposes a generated HTTPS domain.

> Do not create a Railway database, Redis instance, or volume for this deployment. BrightNest uses its existing Neon PostgreSQL database. Redis is optional because the application has a resilience fallback for early low-volume use.

## Railway project setup

1. Open [Railway New Project](https://railway.com/new) and choose **Deploy from GitHub repo**.
2. Select `muhammaduzair56/BrightnestCleaning-` on branch `main`.
3. Open the newly created service and set **Root Directory** to `backend`.
4. Railway detects `backend/railway.json`; keep the build builder as **Nixpacks**.
5. In **Networking**, click **Generate Domain** after the first successful deploy.

The deployment start command is already configured as:

```sh
sh scripts/start.sh
```

The script runs the idempotent database migration and optional initial-admin bootstrap before starting Uvicorn on Railway's `PORT`. The latest migration adds booking currency, integer-pence subtotal/tax/total fields, tax-rate basis points, payment status, provider, reference, and paid timestamp.

## Required Railway variables

Create these under **Service → Variables**. Set sensitive values as masked/secret values. Never commit them or create a frontend variable for them.

| Name | Value or source | Required |
| --- | --- | --- |
| `APP_ENV` | `production` | Yes |
| `DATABASE_URL` | Existing Neon pooled PostgreSQL URL, including SSL options | Yes |
| `JWT_SECRET` | New random secret, 32+ characters | Yes |
| `ADMIN_NOTIFICATION_EMAIL` | `brightnestcleaninguk@gmail.com` | Yes |
| `EMAIL_FROM` | Sender on a verified Resend domain | Yes |
| `RESEND_API_KEY` | Existing server-only Resend key | For booking notifications and customer magic links |
| `FRONTEND_BASE_URL` | `https://brightnestcleaning.vercel.app` | Yes for customer dashboard links |
| `CUSTOMER_MAGIC_LINK_MINUTES` | `30` | Recommended |
| `BOOTSTRAP_ADMIN_EMAIL` | Private admin login email | Initial admin setup |
| `BOOTSTRAP_ADMIN_PASSWORD` | Unique 12+ character password | Initial admin setup |
| `ALLOWED_ORIGINS` | `https://brightnestcleaning.vercel.app` | Yes |
| `TRUSTED_HOSTS` | `*.up.railway.app` initially; later replace with the exact Railway hostname | Yes |
| `ENABLE_DOCS` | `false` | Recommended |
| `LOG_LEVEL` | `INFO` | Recommended |
| `REDIS_URL` | Managed TLS Redis URL, if added later | Optional |

Railway supplies the `PORT` variable automatically. Do not add it manually unless troubleshooting tells you to do so. The backend `requirements.txt` includes ReportLab for generating receipts in memory; no PDF files are stored on disk. Store only payment metadata and processor references in BrightNest. Never store card numbers, CVV, bank details, PANs, or payment secrets; use a payment provider for those credentials.

## Growth and operations configuration

Add these optional variables when the corresponding production destinations are confirmed:

| Name | Purpose |
| --- | --- |
| `COVERAGE_POSTCODE_PREFIXES` | Server-authoritative comma-separated prefixes BrightNest actually serves, for example `B6,B7,B8`. Do not use a broad prefix unless the whole range is genuinely covered. |
| `VITE_COVERAGE_POSTCODE_PREFIXES` | Matching frontend prefixes for immediate form feedback; the backend remains authoritative. |
| `VITE_GOOGLE_REVIEWS_URL` | Public Google Business Profile review URL. The site shows a link only when configured and never fabricates reviews. |
| `VITE_TRUSTPILOT_URL` | Public Trustpilot profile URL, also shown only when configured. |

Weekly, Fortnightly, and Monthly requests create recurring plans. A protected `POST /api/v1/admin/recurring/run` endpoint materializes due visits and advances each plan idempotently. Schedule it through a trusted Railway cron/heartbeat process using admin authentication; do not expose it without authentication.

Referral eligibility is checked through `POST /api/v1/referrals/check`. The endpoint only validates active, non-expired codes within their redemption limit. Connect redemption to the real quote/payment workflow before advertising a live discount.

Authenticated customers can download their export and submit a deletion request from the dashboard. Deletion requests must be reviewed against legal retention obligations before an administrator completes them.

The frontend now includes `robots.txt` and `sitemap.xml`. Replace the sitemap domain if the production hostname changes.

## Verification checklist

After deployment completes, open:

```text
https://YOUR-RAILWAY-DOMAIN.up.railway.app/health
```

It must return:

```json
{"status":"ok","service":"brightnest-api"}
```

Then add this value in the Vercel frontend project and redeploy the website:

```text
VITE_API_BASE_URL=https://YOUR-RAILWAY-DOMAIN.up.railway.app
```

Do not append `/api/v1`; the frontend applies that path internally. Confirm a real test booking is saved in Neon and validate the private `/admin` login. In Admin → Booking requests, enter amounts as whole pence and ensure subtotal plus tax equals total before marking a payment status. The customer receipt should then show the stored currency, tax rate, tax amount, total, payment status, provider, and safe processor reference.
To verify the customer dashboard, request a magic link using the email from a real booking, open the link, confirm upcoming and past bookings are customer-scoped, and confirm an expired or reused link is rejected. From an upcoming booking, submit one reschedule or cancellation request and confirm the customer sees a pending status while the BrightNest notification arrives at `ADMIN_NOTIFICATION_EMAIL`. Only one unresolved change request is accepted per booking. Mark one real booking as completed, then confirm its customer can download a PDF receipt while another customer cannot access it and an unfinished booking returns a clear not-ready response.

## Trial note

Railway's free trial is intended for initial deployment and testing. Monitor Railway usage and upgrade or switch to a permanent free alternative if credits become insufficient for ongoing traffic.
