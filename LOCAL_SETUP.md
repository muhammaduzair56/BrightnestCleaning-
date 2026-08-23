# BrightNest Cleaning UK — local setup

## Backend

From the project root, create a private file named `backend/.env`. Copy the variables inside the `dotenv` block in [`backend/LOCAL_ENV_TEMPLATE.md`](backend/LOCAL_ENV_TEMPLATE.md) into `backend/.env`, then replace the placeholders. Keep `backend/.env` private; it is ignored by Git.

Use the complete Neon pooled PostgreSQL connection string from the same project and branch. Do not mix a password from one Neon project with a host from another. Do not include surrounding quotes in Railway Variables; for a local `.env`, a plain value is also recommended.

Install backend dependencies and run the test suite:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
pytest
```

To run the API locally after the environment is configured:

```bash
cd backend
source .venv/bin/activate
alembic upgrade head
python -m app.bootstrap
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The local health endpoint is `http://localhost:8000/health`.

## Frontend

The frontend uses `VITE_API_BASE_URL` to reach the backend. Create a private root `.env.local` file with:

```dotenv
VITE_API_BASE_URL=http://localhost:8000
```

Do not append `/api/v1`; the frontend API helper adds that path internally. Start the frontend from the project root:

```bash
pnpm install
pnpm dev
```

The frontend will normally be available at `http://localhost:3000`.

## Safety

Never place real Neon, Brevo SMTP, JWT, or admin credentials in GitHub, a ZIP archive, frontend source, screenshots, or chat. The downloadable project includes this safe guide and the backend deployment documentation, not a real `.env` file. Before production use, rotate any credential that has been exposed and set the replacement only in the appropriate private secret store.
