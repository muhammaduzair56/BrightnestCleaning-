# BrightNest Cleaning UK — local backend environment

This file is a safe template only. Copy the variables into a private file named `.env` inside `backend/` on your own computer. Replace every placeholder locally. Never commit or upload that private `.env` file.

```dotenv
APP_ENV=development
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require&channel_binding=require
JWT_SECRET=replace-with-a-long-random-local-secret-at-least-32-characters
JWT_ALGORITHM=HS256
ACCESS_TOKEN_MINUTES=15
REFRESH_TOKEN_DAYS=7
CUSTOMER_MAGIC_LINK_MINUTES=30
COVERAGE_POSTCODE_PREFIXES=B
FRONTEND_BASE_URL=http://localhost:5173
ALLOWED_ORIGINS=http://localhost:5173
TRUSTED_HOSTS=localhost,127.0.0.1
ADMIN_NOTIFICATION_EMAIL=your-private-admin-email@example.com
EMAIL_FROM=BrightNest Cleaning <verified-sender@your-domain.example>
RESEND_API_KEY=replace-with-a-local-or-test-resend-key
BOOTSTRAP_ADMIN_EMAIL=your-private-admin-email@example.com
BOOTSTRAP_ADMIN_PASSWORD=replace-with-a-unique-local-password
REDIS_URL=
ENABLE_DOCS=true
LOG_LEVEL=INFO
```

The database URL must come from the same Neon project and branch that you intend to test. Keep the actual URL only in the private local `.env` file or in Railway Variables. Do not paste it into GitHub, ZIP archives, screenshots, or chat.
