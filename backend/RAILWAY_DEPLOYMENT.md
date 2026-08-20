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

The script runs the idempotent database migration and optional initial-admin bootstrap before starting Uvicorn on Railway's `PORT`.

## Required Railway variables

Create these under **Service → Variables**. Set sensitive values as masked/secret values. Never commit them or create a frontend variable for them.

| Name | Value or source | Required |
| --- | --- | --- |
| `APP_ENV` | `production` | Yes |
| `DATABASE_URL` | Existing Neon pooled PostgreSQL URL, including SSL options | Yes |
| `JWT_SECRET` | New random secret, 32+ characters | Yes |
| `ADMIN_NOTIFICATION_EMAIL` | `brightnestcleaninguk@gmail.com` | Yes |
| `EMAIL_FROM` | Sender on a verified Resend domain | Yes |
| `RESEND_API_KEY` | Existing server-only Resend key | For booking notifications |
| `BOOTSTRAP_ADMIN_EMAIL` | Private admin login email | Initial admin setup |
| `BOOTSTRAP_ADMIN_PASSWORD` | Unique 12+ character password | Initial admin setup |
| `ALLOWED_ORIGINS` | `https://brightnestcleaning.vercel.app` | Yes |
| `TRUSTED_HOSTS` | `*.up.railway.app` initially; later replace with the exact Railway hostname | Yes |
| `ENABLE_DOCS` | `false` | Recommended |
| `LOG_LEVEL` | `INFO` | Recommended |
| `REDIS_URL` | Managed TLS Redis URL, if added later | Optional |

Railway supplies the `PORT` variable automatically. Do not add it manually unless troubleshooting tells you to do so.

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

Do not append `/api/v1`; the frontend applies that path internally. Confirm a real test booking is saved in Neon and validate the private `/admin` login.

## Trial note

Railway's free trial is intended for initial deployment and testing. Monitor Railway usage and upgrade or switch to a permanent free alternative if credits become insufficient for ongoing traffic.
