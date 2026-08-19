#!/usr/bin/env sh
set -eu

# Migrations and initial-admin creation are idempotent. All configuration comes from runtime secrets.
alembic upgrade head
python -m app.bootstrap
exec uvicorn app.main:app --host 0.0.0.0 --port 7860 --proxy-headers --forwarded-allow-ips="*"
