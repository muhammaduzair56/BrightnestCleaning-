# BrightNest Backend: Secrets and Deployment

All operational credentials must be created as deployment-provider secrets and must never be committed to the repository, placed in client-side variables, or rendered in the public website.

| Secret name | Purpose | Required for |
| --- | --- | --- |
| `DATABASE_URL` | Neon PostgreSQL pooled connection URL, including required SSL settings. | Database migrations and all booking/admin APIs. |
| `JWT_SECRET` | A randomly generated secret of at least 32 characters for signing access and refresh tokens. | Admin login and token rotation. |
| `REDIS_URL` | Managed Redis or compatible cache endpoint using TLS where supported. | Shared rate limiting and booking-list cache. |
| `SMTP_HOST` | Brevo SMTP relay host. | Booking and magic-link notification emails. |
| `SMTP_PORT` | Brevo SMTP relay port; `2525` is the recommended Railway value. | Booking and magic-link notification emails. |
| `SMTP_TIMEOUT_SECONDS` | SMTP connection timeout in seconds. | Reliable non-blocking SMTP delivery. |
| `SMTP_USERNAME` | Server-only Brevo SMTP login. | Booking and magic-link notification emails. |
| `SMTP_PASSWORD` | Server-only Brevo SMTP key. | Booking and magic-link notification emails. |
| `ADMIN_NOTIFICATION_EMAIL` | Private mailbox that receives internal booking alerts; never display this address on the public website. | Internal alerts. |
| `EMAIL_FROM` | Sender address accepted by Brevo; use a verified sender/domain where required. | Transactional email delivery. |
| `BOOTSTRAP_ADMIN_EMAIL` | A private initial admin account email; it is never included in API responses or public markup. | One-time admin setup. |
| `BOOTSTRAP_ADMIN_PASSWORD` | A unique, 12+ character password for the first private admin account. | One-time admin setup. |
| `ALLOWED_ORIGINS` | Comma-separated public frontend origins, including the Vercel domain. | Browser-origin control. |
| `TRUSTED_HOSTS` | Comma-separated API hostnames, including the Railway public domain and required healthcheck host. | Host-header protection. |

## Railway setup

Create or open the Railway service connected to `muhammaduzair56/BrightnestCleaning-`, set the service root directory to `backend`, and add the values above under **Service → Variables**. Railway supplies `PORT` automatically. The included startup script runs Alembic migrations, performs optional admin bootstrap, and starts Uvicorn on the injected port. The database stays in Neon and Redis remains optional.

> The repository intentionally contains no real `.env` file and no real API key, database URL, personal email address, JWT secret, or password. Add those values only in the provider’s secret settings.

## Production email setup

Create or obtain a Brevo SMTP key, set `SMTP_HOST=smtp-relay.brevo.com`, use `SMTP_PORT=2525` on Railway, and set `EMAIL_FROM` to the sender accepted by the Brevo account. `ADMIN_NOTIFICATION_EMAIL` can remain the private company mailbox that receives booking alerts. The company mailbox and the private admin account should remain secret configuration only; neither is part of the public frontend bundle.

## Local development

Use an untracked local environment file or your shell’s protected environment configuration. Start from the variable names listed above; do not create a file containing live credentials inside the repository.
