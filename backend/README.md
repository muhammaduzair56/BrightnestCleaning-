---
title: BrightNest Booking API
emoji: 🧼
colorFrom: green
colorTo: blue
sdk: docker
app_port: 7860
pinned: false
---

# BrightNest Booking API

This folder is a Docker-ready FastAPI backend for BrightNest Cleaning UK. It stores booking requests in Neon PostgreSQL, exposes a JWT-protected admin API, sends internal booking notifications through Resend, and uses managed Redis for shared request limiting and short-lived operational caching.

## API contract

| Route | Access | Purpose |
| --- | --- | --- |
| `GET /health` | Public | Lightweight operational health check. |
| `POST /api/v1/bookings` | Public, rate-limited | Submit a validated cleaning request. |
| `POST /api/v1/admin/auth/login` | Private, rate-limited | Exchange an admin email and password for JWT access and refresh tokens. |
| `POST /api/v1/admin/auth/refresh` | Private, rate-limited | Rotate a valid refresh token. |
| `GET /api/v1/admin/dashboard` | JWT admin | Read cached status totals. |
| `GET /api/v1/admin/bookings` | JWT admin | List booking records with pagination and optional status filter. |
| `PATCH /api/v1/admin/bookings/{booking_id}` | JWT admin | Update status and private internal notes. |

## Deployment to Hugging Face Spaces

Create a new **Docker Space**, then upload or push this `backend/` directory as the Space repository. The included `README.md` declares Docker and port `7860`; the `Dockerfile` creates the required non-root user and starts the FastAPI service on that port. Add the environment values in the Space’s **Settings → Variables and secrets** before the first startup.

The startup command applies the Alembic migration and creates the first private administrator only when `BOOTSTRAP_ADMIN_EMAIL` and `BOOTSTRAP_ADMIN_PASSWORD` are present. Both operations are idempotent, so safe restarts do not duplicate records.

## Deployment to Railway

Railway can deploy this backend directly from the GitHub repository without Docker. In Railway, select the repository, set **Root Directory** to `backend`, and use the included `railway.json`. The start script detects Railway's `PORT` automatically while preserving port `7860` for the existing Docker workflow. Read [`RAILWAY_DEPLOYMENT.md`](./RAILWAY_DEPLOYMENT.md) for exact secret values, verification steps, and the Vercel API URL update.

## Required secrets

Read [`SECRETS_AND_DEPLOYMENT.md`](./SECRETS_AND_DEPLOYMENT.md) for the complete variables list, handling rules, and production email requirements. The key set is `DATABASE_URL`, `JWT_SECRET`, `REDIS_URL`, `RESEND_API_KEY`, `ADMIN_NOTIFICATION_EMAIL`, `EMAIL_FROM`, `BOOTSTRAP_ADMIN_EMAIL`, `BOOTSTRAP_ADMIN_PASSWORD`, `ALLOWED_ORIGINS`, and `TRUSTED_HOSTS`.

## Connect the public website

After the Space is live, add `VITE_API_BASE_URL=https://YOUR-SPACE.hf.space` to the frontend host’s environment variables, rebuild the static site, and put its exact public origin in the backend `ALLOWED_ORIGINS` secret. The browser only receives the API URL, never database, Redis, JWT, Resend, or admin credentials.

## Local validation

Install dependencies with `pip install -r requirements.txt`, set secret values through your protected shell environment, then run `pytest -q`. Start the API with `uvicorn app.main:app --reload` after applying `alembic upgrade head`.
