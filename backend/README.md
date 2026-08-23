# BrightNest Booking API

This folder contains the Docker-ready FastAPI backend for BrightNest Cleaning UK. It stores booking requests and operational records in Neon PostgreSQL, exposes JWT-protected administrator routes, supports passwordless customer dashboard access, generates PDF receipts, and sends booking-related notifications through Brevo SMTP. Redis is supported for shared rate limiting and short-lived operational caching, with a resilient fallback for low-volume operation when Redis is not configured.

## API contract

The service exposes 23 application endpoints: one public health endpoint, four admin-auth endpoints, eleven booking/admin-operation endpoints, and seven customer endpoints. The API prefix is `/api/v1` for all routes except `/health`.

| Route | Access | Purpose |
| --- | --- | --- |
| `GET /health` | Public | Lightweight Railway health check. |
| `GET /api/v1/availability` | Public, rate-limited | Returns available booking slots for a date and optional service. |
| `POST /api/v1/referrals/check` | Public, rate-limited | Validates an active referral code. |
| `POST /api/v1/bookings` | Public, rate-limited | Creates a validated booking request. |
| `POST /api/v1/admin/auth/login` | Rate-limited | Exchanges admin credentials for JWT tokens. |
| `POST /api/v1/admin/auth/refresh` | Refresh-token protected | Rotates the admin token pair. |
| `POST /api/v1/admin/auth/logout` | Admin JWT | Revokes the active refresh session. |
| `GET /api/v1/admin/auth/me` | Admin JWT | Returns the authenticated admin profile. |
| `GET /api/v1/admin/bookings` | Admin JWT | Lists bookings with pagination and status filtering. |
| `GET /api/v1/admin/bookings/{booking_id}` | Admin JWT | Reads one booking. |
| `PATCH /api/v1/admin/bookings/{booking_id}` | Admin JWT | Updates status, notes, and payment metadata. |
| `GET /api/v1/admin/change-requests` | Admin JWT | Lists customer change requests. |
| `PATCH /api/v1/admin/change-requests/{request_id}` | Admin JWT | Reviews and resolves a change request. |
| `POST /api/v1/admin/recurring/run` | Admin JWT | Materialises due recurring visits idempotently. |
| `GET /api/v1/admin/analytics` | Admin JWT | Returns date/service-filtered analytics and trends. |
| `GET /api/v1/admin/dashboard` | Admin JWT | Returns cached status counters. |
| `POST /api/v1/customer/access/request` | Public, rate-limited | Sends a one-time customer magic link. |
| `POST /api/v1/customer/access/exchange` | One-time link token | Exchanges a valid link for a customer session. |
| `GET /api/v1/customer/bookings` | Customer JWT | Returns customer-scoped upcoming and past bookings. |
| `POST /api/v1/customer/bookings/{booking_id}/change-requests` | Customer JWT | Requests a future-booking reschedule or cancellation. |
| `GET /api/v1/customer/bookings/{booking_id}/receipt` | Customer JWT | Streams an eligible completed-booking PDF receipt. |
| `POST /api/v1/customer/data-requests` | Customer JWT | Records an export or deletion request. |
| `GET /api/v1/customer/data-export` | Customer JWT | Returns customer-scoped export data. |

## Railway deployment

Connect `muhammaduzair56/BrightnestCleaning-` on branch `main` to Railway, set the service **Root Directory** to `backend`, and use the included `railway.json` or `scripts/start.sh`. Railway supplies `PORT` automatically. The startup sequence applies Alembic migrations, optionally bootstraps the first administrator, and starts Uvicorn on the injected port.

Use [`RAILWAY_DEPLOYMENT.md`](./RAILWAY_DEPLOYMENT.md) for the full variable table and verification checklist. After deployment, the health endpoint must return:

```json
{"status":"ok","service":"brightnest-api"}
```

The included `Dockerfile` remains available for container-based hosting, but Railway is the active production backend deployment path.

## Secrets

Use [`SECRETS_AND_DEPLOYMENT.md`](./SECRETS_AND_DEPLOYMENT.md) and [`LOCAL_ENV_TEMPLATE.md`](./LOCAL_ENV_TEMPLATE.md). The active email variables are `SMTP_HOST`, `SMTP_PORT`, `SMTP_TIMEOUT_SECONDS`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `ADMIN_NOTIFICATION_EMAIL`, and `EMAIL_FROM`. Never commit `.env`, Neon URLs, JWT secrets, SMTP keys, admin passwords, or customer data.

## Connect the public website

Set the Vercel frontend variable to the Railway public origin only:

```text
VITE_API_BASE_URL=https://YOUR-RAILWAY-DOMAIN.up.railway.app
```

Do not append `/api/v1`; the frontend API helper adds that path internally. The browser receives only the public API origin and never receives database, Redis, JWT signing, SMTP, or admin credentials.

## Local validation

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
python -m app.bootstrap
pytest -q
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The local health endpoint is `http://localhost:8000/health`. Create the private environment file from [`LOCAL_ENV_TEMPLATE.md`](./LOCAL_ENV_TEMPLATE.md); do not store real credentials in the repository.
