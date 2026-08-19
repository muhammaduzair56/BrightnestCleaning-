# BrightNest Backend: Secrets and Deployment

All operational credentials must be created as deployment-provider secrets and must never be committed to the repository, placed in client-side variables, or rendered in the public website.

| Secret name | Purpose | Required for |
| --- | --- | --- |
| `DATABASE_URL` | Neon PostgreSQL pooled connection URL, including required SSL settings. | Database migrations and all booking/admin APIs. |
| `JWT_SECRET` | A randomly generated secret of at least 32 characters for signing access and refresh tokens. | Admin login and token rotation. |
| `REDIS_URL` | Managed Redis or compatible cache endpoint using TLS where supported. | Shared rate limiting and booking-list cache. |
| `RESEND_API_KEY` | Server-only Resend API credential. | Booking notification emails. |
| `ADMIN_NOTIFICATION_EMAIL` | Private mailbox that receives internal booking alerts; never display this address on the public website. | Internal alerts. |
| `EMAIL_FROM` | Sender using a domain verified in Resend; do not use a Gmail address as the production sender. | Transactional email delivery. |
| `BOOTSTRAP_ADMIN_EMAIL` | A private initial admin account email; it is never included in API responses or public markup. | One-time admin setup. |
| `BOOTSTRAP_ADMIN_PASSWORD` | A unique, 12+ character password for the first private admin account. | One-time admin setup. |
| `ALLOWED_ORIGINS` | Comma-separated public frontend origins, including the Vercel domain. | Browser-origin control. |
| `TRUSTED_HOSTS` | Comma-separated API hostnames, including the Hugging Face Space domain. | Host-header protection. |

## Hugging Face Space setup

Create a Docker Space and add the values above in **Settings → Variables and secrets**. Runtime secrets are available to the application process as environment variables, while the FastAPI container exposes only one public port, `7860`. The database stays in Neon and Redis stays in a managed external service, because local container data is not durable across Space restarts.

> The repository intentionally contains no real `.env` file and no real API key, database URL, personal email address, JWT secret, or password. Add those values only in the provider’s secret settings.

## Production email setup

Before enabling notifications, add and verify a domain in Resend. Set `EMAIL_FROM` to a sender address on that verified domain, while `ADMIN_NOTIFICATION_EMAIL` can remain the private company mailbox that receives booking alerts. The company mailbox and the private admin account should remain database and secret configuration only; neither is part of the public frontend bundle.

## Local development

Use an untracked local environment file or your shell’s protected environment configuration. Start from the variable names listed above; do not create a file containing live credentials inside the repository.
