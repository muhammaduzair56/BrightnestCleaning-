#!/usr/bin/env sh
set -eu

# Migrations and initial-admin creation are idempotent. All configuration comes from runtime secrets.
PORT_VALUE="${PORT:-8080}"
echo "Vellora API startup: port=${PORT_VALUE}"
echo "Vellora API startup: applying database migrations"
alembic upgrade head
echo "Vellora API startup: migrations complete"
echo "Vellora API startup: running bootstrap"
python -m app.bootstrap
echo "Vellora API startup: launching Uvicorn"
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT_VALUE}" --proxy-headers --forwarded-allow-ips="*"
