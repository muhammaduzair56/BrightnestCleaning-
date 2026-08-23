# BrightNest Cleaning UK — Complete Project Documentation

**Document purpose:** This is the complete technical and product handover for the BrightNest Cleaning UK website and booking platform. It describes the implementation currently present in the repository, the production architecture, the user journeys, the backend API contract, the security model, the deployment process, testing status, known limitations, and recommended future extensions.

**Current brand:** BrightNest Cleaning UK  
**Primary market:** Birmingham and surrounding areas, United Kingdom  
**Frontend deployment:** Vercel (`https://brightnestcleaning.vercel.app`)  
**Backend deployment:** Railway (`https://brightnestcleaning-production.up.railway.app`)  
**Database:** Neon PostgreSQL  
**Email transport:** Brevo SMTP  
**Documentation status:** Updated for the current SMTP, booking, dashboard, analytics, blog, and payment-metadata implementation.

> **Security notice:** This document intentionally contains no real database URL, JWT secret, SMTP key, admin password, or private customer data. Production secrets must remain in Vercel/Railway secret variables and private local environment files only.

---

## 1. Executive overview

BrightNest Cleaning UK is a premium cleaning-service website with a public marketing experience, a detailed multi-step booking flow, a private customer dashboard, and a protected administrator dashboard. Customers can request domestic and specialist cleaning, choose property details and visit timing, receive availability-aware time options, and access their future and past bookings through a secure email magic-link flow.

The backend is a separate FastAPI service. It persists bookings and operational records in Neon PostgreSQL, protects administrator routes with JWT access and refresh tokens, uses one-time customer magic links, creates PDF receipts for completed bookings, supports recurring plans, validates postcode coverage, records audit events, and sends booking-related notifications through Brevo SMTP. Redis is supported for shared rate limiting and operational caching, with a fallback path for low-volume operation when Redis is not configured.

The current payment system stores safe payment metadata only. An administrator can record a quote, tax, payment status, provider, processor reference, and paid date. The platform does **not** currently collect card payments automatically; Stripe Checkout and webhooks remain a future upgrade.

---

## 2. Technology stack

| Layer | Technology | Role in the project |
| --- | --- | --- |
| Frontend language | TypeScript | Type-safe React application code. |
| Frontend framework | React 19 | Component-based UI and page rendering. |
| Frontend build tool | Vite 7 | Development server, production bundling, and asset handling. |
| Styling | Tailwind CSS 4 plus project CSS tokens | Responsive layout, brand styling, typography, spacing, states, and motion. |
| UI primitives | Radix UI and local shadcn-style components | Accessible dialogs, popovers, calendars, selects, buttons, cards, tabs, tooltips, and other controls. |
| Icons | `lucide-react` | Consistent interface icons for actions, services, navigation, and status. |
| Routing | Wouter | Lightweight client-side routes including `/`, `/blog`, `/blog/:id`, `/admin`, and `/dashboard`. |
| Charts | Recharts | Revenue and cancellation trend visualisations in the admin dashboard. |
| Form validation | React Hook Form, Zod, and custom validation logic | Field validation, consent handling, dynamic booking validation, and user feedback. |
| Notifications | Sonner | Frontend toast and feedback states. |
| Backend language | Python 3.12-compatible Python | API, business logic, background notification tasks, receipts, and operational tooling. |
| Backend framework | FastAPI 0.116 | REST API, request validation, OpenAPI support when enabled, and route organisation. |
| ASGI server | Uvicorn | Production and local API process. |
| ORM | SQLAlchemy 2 | Database models, queries, relationships, transaction handling, and connection management. |
| Database driver | Psycopg 3 and Psycopg 2 compatibility package | PostgreSQL connectivity. |
| Database | Neon PostgreSQL | Durable production data store for bookings, users, auth artifacts, analytics inputs, and audit records. |
| Migrations | Alembic | Versioned, repeatable schema changes and safe deployment startup migrations. |
| Configuration | Pydantic Settings | Typed environment-variable loading and safe secret handling. |
| Admin authentication | PyJWT, Passlib, bcrypt | JWT access/refresh tokens and password hashing. |
| Customer authentication | One-time hashed magic links plus JWT exchange | Passwordless customer dashboard access scoped to the customer email. |
| Caching and rate limiting | Redis with application fallback | Shared request limiting and short-lived operational cache where configured. |
| PDF receipts | ReportLab | In-memory customer receipt/PDF generation without storing receipt files on disk. |
| Email | Python `smtplib` with `asyncio.to_thread` | Non-blocking Brevo SMTP delivery for booking and dashboard notifications. |
| Hosting | Vercel and Railway | Static frontend hosting and containerised/server backend hosting. |
| Testing | Pytest, HTTPX, TypeScript compiler, Vite production build | Backend regression tests, API tests, type safety, and frontend build validation. |

The root frontend package also contains additional reusable libraries such as `framer-motion`, `axios`, `react-day-picker`, `embla-carousel-react`, and the Radix component family. Only the packages used by the current screens should be retained during future dependency-cleanup passes.

---

## 3. Brand and visual system

The website follows a **Quiet British Home Editorial** direction. It is intentionally calmer and more considered than a generic cleaning template, while still making the booking action obvious.

| Design area | Current implementation |
| --- | --- |
| Core palette | Warm ivory background, mint/sage surfaces and accents, ink navy text and dark operational panels. |
| Typography | DM Serif Display for editorial headlines and Manrope for navigation, labels, body copy, controls, and operational UI. |
| Layout | Asymmetric editorial hero compositions, contained navigation rails, wide whitespace, two-column feature panels, and responsive stacked layouts. |
| Navigation | Sticky public navigation rail with strict primary links, separate customer booking access, and a prominent “Book a clean” CTA. |
| Interaction | Short, tactile hover and active states, accessible focus rings, smooth booking handoffs, loading feedback, and compact mobile menus. |
| Imagery | Original/generic cleaning and home imagery; reference websites informed information architecture only and are not copied for branding or article content. |
| Voice | Calm, practical, warm, and specific. Copy avoids exaggerated promises and focuses on making the next clean easier to plan. |

The public site includes a BrightNest logo in the header, footer, favicon, and trust-oriented areas. The blog and landing pages keep the same visual language rather than introducing a separate editorial brand.

---

## 4. Repository structure

```text
brightnest-cleaning/
├── client/
│   ├── index.html                 # Frontend document shell, fonts, favicon, base SEO
│   ├── public/                    # Small public files and bundled blog assets
│   └── src/
│       ├── App.tsx                # Route registration and providers
│       ├── index.css              # Global tokens and shared style utilities
│       ├── main.tsx               # React entry point
│       ├── components/            # Reusable UI and dashboard primitives
│       ├── contexts/              # Theme/context providers
│       ├── hooks/                 # Reusable React hooks
│       ├── lib/                   # Frontend helpers and API support
│       └── pages/
│           ├── Home.tsx           # Public landing page and booking flow
│           ├── Blog.tsx           # Blog index, article routes, SEO and sharing
│           ├── Admin.tsx          # Protected admin dashboard
│           ├── Dashboard.tsx      # Customer magic-link dashboard
│           ├── PrivacyPolicy.tsx  # Privacy policy page
│           ├── TermsOfService.tsx # Terms, cancellation, and refund terms
│           └── NotFound.tsx       # Fallback route
├── backend/
│   ├── app/
│   │   ├── main.py               # FastAPI application, middleware, health route
│   │   ├── config.py             # Typed server-side settings
│   │   ├── database.py           # SQLAlchemy engine/session setup
│   │   ├── models.py              # PostgreSQL persistence models and indexes
│   │   ├── schemas.py             # Pydantic request/response contracts
│   │   ├── security.py            # JWT, password, and magic-link helpers
│   │   ├── notifications.py       # Brevo SMTP transport and notification bodies
│   │   ├── receipts.py            # In-memory PDF receipt generation
│   │   ├── coverage.py            # Postcode coverage validation
│   │   ├── rate_limit.py          # Redis-backed/fallback request limiting
│   │   ├── cache.py               # Operational cache abstraction
│   │   ├── bootstrap.py           # Idempotent initial-admin bootstrap
│   │   └── routers/
│   │       ├── auth.py            # Admin authentication endpoints
│   │       ├── bookings.py        # Booking, availability, admin, recurring, analytics
│   │       └── customer.py        # Magic links, customer dashboard, GDPR, receipts
│   ├── alembic/                   # Versioned schema migrations
│   ├── scripts/start.sh           # Railway/Docker migration and launch sequence
│   ├── tests/                     # Backend tests, including SMTP regression coverage
│   ├── Dockerfile                 # Non-root container image
│   ├── railway.json               # Railway deployment configuration
│   ├── LOCAL_ENV_TEMPLATE.md      # Safe local variable template
│   └── RAILWAY_DEPLOYMENT.md      # Railway setup and verification guide
├── server/index.ts                # Frontend hosting/dev bridge entry
├── shared/const.ts                # Shared compatibility constants
├── vercel.json                    # SPA fallback/deployment configuration
├── package.json                   # Frontend dependencies and scripts
├── pnpm-lock.yaml                 # Locked frontend dependency graph
├── LOCAL_SETUP.md                 # Local setup and test instructions
├── ideas.md                       # Chosen visual philosophy and design decisions
└── BRIGHTNEST_PROJECT_DOCUMENTATION.md
```

---

## 5. Frontend routes and screen inventory

| Route | Screen | Access | Purpose |
| --- | --- | --- | --- |
| `/` | Home | Public | Marketing site, service catalogue, trust content, FAQs, and complete booking request flow. |
| `/blog` | Blog index | Public | Editorial home-care journal with eight article cards. |
| `/blog/:id` | Blog article | Public | Structured article detail page with concise sections, checklist blocks, SEO metadata, and sharing controls. |
| `/admin` | Admin dashboard | Private | Admin login, booking operations, analytics, customer change requests, payment metadata, and status management. |
| `/dashboard` | Customer dashboard | Private magic-link session | Upcoming/past bookings, change requests, pricing breakdown, receipts, and data controls. |
| `/privacy-policy` | Privacy Policy | Public | Privacy and data-handling information linked from booking consent and footer. |
| `/terms-of-service` | Terms of Service | Public | Terms, cancellation rules, refund guidance, and customer obligations. |
| `/404` | Not Found | Public | Fallback route for unknown paths. |

The application uses lazy-loaded route imports for the large public pages and operational screens. This keeps non-home route code out of the initial bundle where possible. The build still reports a large shared JavaScript chunk, so a future performance pass can further split shared dependencies.

---

## 6. Public homepage and UI features

### 6.1 Public navigation and hero

The homepage includes a strict sticky navigation rail with Home, About us, Services, Blog, and Contact-style destinations, along with customer bookings and a primary booking CTA. The hero uses a strong filled “Plan your clean” action and a quieter secondary route to services. The mobile menu remains keyboard reachable and includes the same key actions.

The hero communicates Birmingham coverage, thoughtful domestic and specialist cleaning, and a simple request journey. Trust cues are written conservatively: the website does not claim insurance, DBS checks, or certifications unless the business verifies and supplies those claims.

### 6.2 Services and add-ons

The service catalogue supports domestic cleaning, deep cleaning, end-of-tenancy cleaning, move-in/move-out work, post-renovation cleaning, Airbnb or short-term rental work, office/commercial cleaning, window cleaning, oven cleaning, carpet cleaning, rug cleaning, sofa/upholstery cleaning, rubbish/waste removal, small one-off jobs, and the added bin-cleaning option.

The homepage highlights popular services first and keeps the longer catalogue behind an explicit reveal interaction. Service cards use category icons rather than unexplained numeric badges. Quote-based services are labelled as quote-based, and the interface explains that the final price depends on property details and scope.

The specialist add-on panel includes BrightNest-specific prices and a **Book Now** handoff for each add-on. Current supplied add-on examples include extra single oven cleaning, inside-window cleaning, fridge cleaning, washing-machine cleaning, living-room carpet cleaning, sofa-seat cleaning, mattress cleaning, and full-property specialist work. Each add-on includes hover/focus treatment and an explanatory tooltip or scope note.

### 6.3 Trust and information sections

The homepage includes:

- A trust section using the supplied authentic client-shared before-and-after material and feedback context, without inventing reviews.
- A “How it works” explanation of request, review, confirmation, and visit stages.
- A FAQ section covering booking, timing, cancellations, recurring requests, and quote-based work.
- Footer trust cues for coverage, privacy-first handling, and the fact that a booking request is not itself a card payment.
- Privacy Policy and Terms of Service links.
- Responsive spacing, mobile stacking, visible keyboard focus, and no intentional horizontal overflow.

### 6.4 Booking form journey

The booking form is a multi-step flow designed to collect enough information for a useful initial review without overwhelming the customer.

| Booking capability | Behaviour |
| --- | --- |
| Service selection | Branded custom service picker instead of a plain native dropdown. |
| Frequency | One-off, weekly, fortnightly/bi-weekly, and monthly visit rhythm choices. |
| Property details | Bedrooms and bathrooms are collected for applicable home-cleaning services. Bin cleaning does not require bedroom/bathroom counts. |
| Add-on detail | Bin cleaning and other specialist choices can be included in the request. |
| Customer contact | Name, email, phone, postcode, and customer note fields. |
| Postcode validation | Frontend gives immediate coverage feedback; backend remains authoritative through configured postcode prefixes. |
| Date selection | Branded future-date picker with Soonest, Tomorrow, and In 3 days quick choices. Past dates are blocked. |
| Time selection | Branded time-window picker backed by the availability API. Fully booked slots are unavailable. |
| Dynamic price summary | Indicative calculation updates as service, room counts, and add-ons change. It is guidance, not a guaranteed final quote for quote-based services. |
| Consent | Mandatory privacy-policy consent checkbox immediately before submission. |
| Validation | Email and phone validation, required service/contact fields, coverage checks, date/time validation, and minimum bedroom/bathroom rules where applicable. |
| Submission state | Loading animation, disabled duplicate submission behaviour, success confirmation, and readable failure feedback. |
| Backend payload | Sends the booking request to the FastAPI service through `VITE_API_BASE_URL`; the frontend adds `/api/v1` internally. |

A successful submission returns a booking identifier and triggers background notification work. The form does not promise an instant final price for specialist or quote-based work.

---

## 7. Blog and SEO implementation

The BrightNest Notes blog now contains eight original article records. The index page uses a four-column desktop / two-column smaller-screen card system and a longer editorial page with compact excerpts. Each card links to a dedicated route rather than jumping to a large wall of text.

Current article topics include deep-cleaning resets, gentler cleaning products, rental changeovers, winter home care, laundry rhythm, bathroom resets, small-office resets, and clearer windows. Article pages use a concise introduction, three short reading sections, optional checklist points, a booking CTA, and a share section.

Each blog view updates the document head at runtime with:

- A route-specific `document.title`.
- A route-specific meta description.
- Canonical URL.
- Open Graph title, description, type, URL, and image.
- Twitter card, title, description, and image.
- Absolute social-image URLs so platforms can resolve previews reliably.

The base HTML shell also contains site-level metadata, favicon, theme colour, Open Graph defaults, Twitter defaults, and UK English language declaration. `robots.txt` and `sitemap.xml` are included for basic crawl support.

Each article includes responsive share controls for WhatsApp, Facebook, X, and Copy link. The copy action uses the browser Clipboard API and gives an immediate “Copied” confirmation. Share links open external share destinations in a new tab with `noopener`-equivalent `noreferrer` behaviour. The website does not send article data to a third-party analytics or social SDK merely to render these controls.

---

## 8. Customer dashboard

The customer dashboard is passwordless. A customer enters the email associated with a booking, requests access, receives a one-time magic link, and exchanges that link for a customer-scoped bearer session.

The dashboard provides:

- Upcoming booking list.
- Past booking list.
- Booking status and visit details.
- Service, frequency, property, and customer-note context.
- Pricing breakdown with currency, subtotal, tax rate, tax amount, total, and payment status when recorded.
- Downloadable PDF receipt for eligible completed bookings.
- Reschedule request form for future bookings.
- Cancellation request form for future bookings.
- Pending change-request status.
- Customer data export request/download.
- Customer deletion request submission.
- Logout and expired-session handling.

Customer access is scoped by the authenticated email. A customer cannot use the dashboard API to browse another customer’s bookings or download another customer’s receipt.

---

## 9. Admin dashboard

The admin panel uses a persistent operational layout with a private login form, booking list, detail panel, analytics, and customer-change workflow.

### 9.1 Authentication and session

Admins sign in with email and password. The backend returns an access token and refresh token. The frontend keeps the short-lived access token in browser session storage for the active session and calls protected endpoints with the bearer token. Expired or missing tokens result in a login state rather than exposing protected data.

### 9.2 Booking operations

The admin can:

- View paginated booking requests.
- Filter the list by booking status.
- Open a detailed booking record.
- Review customer name, email, phone, postcode, service, frequency, date, time, rooms, bin-cleaning choice, and customer notes.
- Record private internal notes.
- Change lifecycle status between new, contacted, confirmed, completed, and cancelled.
- View customer reschedule/cancellation requests.
- Approve, decline, or resolve change requests with a resolution note.
- Preserve audit context for administrative changes.

### 9.3 Pricing and payment metadata

The admin detail panel includes currency, payment status, subtotal in pence, tax rate, tax in pence, total in pence, provider, payment reference, paid-at timestamp, and internal note. The UI blocks saving inconsistent totals and requires:

```text
Total pence = Subtotal pence + Tax pence
```

For example, a £65.00 no-tax test amount is recorded as subtotal `6500`, tax rate `0`, tax `0`, total `6500`. The user interface intentionally uses integer pence to avoid floating-point currency errors.

The admin can mark a booking confirmed even when its payment status is unpaid, because confirmation and payment are separate business states. Revenue analytics use the configured date filters and the booking’s recorded payment/amount fields. When testing a future booking, the analytics date range must include the future preferred visit date if the current aggregation is visit-date based.

No card number, CVV, PAN, bank password, or full bank credentials are stored in this system. The provider and reference fields are metadata only.

### 9.4 Analytics

The dashboard includes:

- Total requests.
- New, contacted, confirmed, completed, and cancelled counts.
- Completed revenue summary.
- Completed visit count.
- Cancellation count/rate.
- Revenue trend chart.
- Cancellation-rate chart.
- Start/end date filters.
- Service-type filter.
- Empty-state messages when no activity matches the filters.

The analytics API aggregates real booking data. It does not invent revenue, ratings, reviews, or customer activity.

---

## 10. Backend architecture

The backend is a modular FastAPI application created in `backend/app/main.py`. It applies trusted-host validation, request limiting, CORS, request IDs, security headers, structured validation errors, and configurable API documentation before registering the three router groups.

The service starts through `backend/scripts/start.sh`. In the Railway deployment flow it applies Alembic migrations, runs the idempotent admin bootstrap when configured, and starts Uvicorn on Railway’s injected `PORT`. The service binds to `0.0.0.0`, and the health endpoint is:

```text
GET /health
```

Expected response:

```json
{"status":"ok","service":"brightnest-api"}
```

API documentation is disabled by default in production through `ENABLE_DOCS=false`. It can be enabled privately for development or controlled testing.

---

## 11. Complete API inventory

The current backend exposes **23 application endpoints**: one operational health endpoint, four admin-auth endpoints, eleven booking/admin-operation endpoints, and seven customer endpoints.

All application routes below use the `/api/v1` prefix unless otherwise stated.

### 11.1 Operational and public booking endpoints

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| `GET` | `/health` | Public | Railway/Vercel connectivity and process health check. This route is not under `/api/v1`. |
| `GET` | `/api/v1/availability` | Public, rate-limited | Returns available time slots for a preferred date and optional service type, considering active bookings and configured capacity. |
| `POST` | `/api/v1/referrals/check` | Public, rate-limited | Validates an active, non-expired referral code and returns eligibility/discount information. |
| `POST` | `/api/v1/bookings` | Public, rate-limited | Validates and creates a booking request, records property/payment defaults, creates recurring-plan data when required, and schedules notifications. |

### 11.2 Admin authentication endpoints

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| `POST` | `/api/v1/admin/auth/login` | Public but rate-limited | Verifies admin credentials and returns access/refresh JWTs. |
| `POST` | `/api/v1/admin/auth/refresh` | Refresh-token protected | Rotates a valid refresh token and returns a new token pair. |
| `POST` | `/api/v1/admin/auth/logout` | Admin bearer token | Revokes the active refresh-token record/session context. |
| `GET` | `/api/v1/admin/auth/me` | Admin bearer token | Returns the authenticated admin profile. |

### 11.3 Admin booking, workflow, recurring, and analytics endpoints

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/v1/admin/bookings` | Admin bearer token | Lists bookings with pagination and optional status filtering. |
| `GET` | `/api/v1/admin/bookings/{booking_id}` | Admin bearer token | Reads a single booking and its operational details. |
| `PATCH` | `/api/v1/admin/bookings/{booking_id}` | Admin bearer token | Updates status, internal notes, pricing/payment metadata, and related admin-managed fields according to schema validation. |
| `GET` | `/api/v1/admin/change-requests` | Admin bearer token | Lists customer reschedule/cancellation requests, optionally filtered by request status. |
| `PATCH` | `/api/v1/admin/change-requests/{request_id}` | Admin bearer token | Reviews, approves, declines, or resolves a customer change request and records the admin decision. |
| `POST` | `/api/v1/admin/recurring/run` | Admin bearer token | Materialises due recurring visits and advances recurring plans idempotently. |
| `GET` | `/api/v1/admin/analytics` | Admin bearer token | Returns status summaries, revenue/cancellation trends, and date/service-filtered analytics. |
| `GET` | `/api/v1/admin/dashboard` | Admin bearer token | Returns cached operational booking counters for the admin summary cards. |

### 11.4 Customer access and dashboard endpoints

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| `POST` | `/api/v1/customer/access/request` | Public, rate-limited | Requests a one-time customer magic link for the email associated with a booking. |
| `POST` | `/api/v1/customer/access/exchange` | One-time magic-link token | Exchanges a valid, unexpired, unused link for a customer bearer session. |
| `GET` | `/api/v1/customer/bookings` | Customer bearer token | Returns the authenticated customer’s upcoming/past bookings and relevant pending change requests. |
| `POST` | `/api/v1/customer/bookings/{booking_id}/change-requests` | Customer bearer token | Creates a future-booking reschedule or cancellation request, subject to one-open-request and timing rules. |
| `GET` | `/api/v1/customer/bookings/{booking_id}/receipt` | Customer bearer token | Streams a PDF receipt for an eligible completed booking owned by the customer. |
| `POST` | `/api/v1/customer/data-requests` | Customer bearer token | Records a customer export or deletion request. |
| `GET` | `/api/v1/customer/data-export` | Customer bearer token | Returns the authenticated customer’s exportable booking/account data. |

FastAPI also generates an OpenAPI document when `ENABLE_DOCS=true`; the production configuration defaults to disabling `/docs` and `/openapi.json` to reduce unnecessary public surface area.

---

## 12. Database and data model

Neon PostgreSQL stores the operational data. SQLAlchemy models use UUID-like string identifiers, timestamps, enumerated status values, relationships, and indexes on frequently queried columns.

| Table/model | Main purpose | Important fields |
| --- | --- | --- |
| `admin_users` | Administrator identity and role | Email, password hash, role, active flag, created/updated timestamps, last login. |
| `refresh_tokens` | Refresh-token lifecycle | Hashed JTI, admin ID, expiry, revocation timestamp, created timestamp. |
| `bookings` | Core customer booking requests | Customer contact, postcode, service, frequency, date/time, bedrooms, bathrooms, bin cleaning, notes, status, email status, pricing/payment metadata, consent timestamp, audit timestamps. |
| `customer_change_requests` | Reschedule/cancellation workflow | Booking ID, customer email, type, requested date/time, message, status, review/resolution timestamps, admin resolution. |
| `referral_codes` | Referral validation and redemption limits | Code, discount percentage, max redemptions, redemption count, active flag, expiry. |
| `recurring_booking_plans` | Recurring visit schedule | Source booking, customer email, frequency, next date, active flag, generation timestamps. |
| `customer_data_requests` | Export and deletion requests | Customer email, request type, status, created/resolved timestamps. |
| `customer_magic_links` | Passwordless dashboard access | Hashed token, customer email, expiry, used timestamp, creation timestamp. |
| `audit_events` | Admin and booking audit trail | Admin ID, booking ID, action, JSON metadata, timestamp. |

### 12.1 Booking lifecycle values

Booking statuses are `new`, `contacted`, `confirmed`, `cancelled`, and `completed`. Payment statuses are `unpaid`, `paid`, `partially_refunded`, `refunded`, and `failed`. Customer change-request statuses are `requested`, `reviewed`, and `resolved`, with request types `reschedule` and `cancel`.

### 12.2 Indexing and query safety

The booking model indexes customer email, postcode, service type, preferred date, status, created time, and composite operational filters. Change requests, referral codes, recurring plans, magic links, refresh tokens, and audit events also have indexes for their lookup paths. Availability checks use transaction-safe locking so two simultaneous requests cannot both consume the same final slot when capacity is exhausted.

The application keeps database connections healthy with SQLAlchemy connection-pool settings and `pool_pre_ping=True` behaviour. Database access is server-side only; no Neon URL is sent to the browser.

---

## 13. Authentication and security

### 13.1 Admin JWT flow

The admin signs in with email/password. Passwords are stored as bcrypt hashes. The API returns a short-lived access token and longer-lived refresh token. Refresh-token identifiers are hashed in the database and can be revoked. Protected routes require a valid bearer token and admin role.

### 13.2 Customer magic-link flow

The customer requests access using the email attached to a booking. A random token is generated, only its hash is stored, and the raw token is delivered through the email notification. The token is single-use and expires after the configured interval. A successful exchange returns a customer-scoped bearer session; expired or reused links are rejected.

### 13.3 HTTP and application protections

The backend includes:

- Trusted-host validation through `TRUSTED_HOSTS`.
- Explicit CORS allow-list through `ALLOWED_ORIGINS`.
- Request IDs through `X-Request-ID`.
- `X-Content-Type-Options: nosniff`.
- `Referrer-Policy: no-referrer`.
- No-store caching for API responses.
- Rate limiting with Redis support and a fallback path.
- Structured request-validation errors.
- No raw secret logging.
- No card, CVV, PAN, or bank-password storage.
- Customer-level ownership checks for bookings, receipts, and data export.
- Audit events for important admin operations.
- Idempotent startup migrations and bootstrap logic.

Before production use, rotate any credential ever pasted into chat, screenshots, a public repository, or an archive. The safe ZIP produced for this project must never contain `.env` files or secret values.

---

## 14. Email and SMTP integration

The active notification transport is standard-library SMTP, not Resend. `backend/app/notifications.py` runs blocking SMTP calls through `asyncio.to_thread` so FastAPI request handling is not blocked by network delivery.

The transport supports:

- New-booking notification to `ADMIN_NOTIFICATION_EMAIL`.
- Customer magic-link delivery.
- Booking change-request notifications.
- Sender formatting such as `BrightNest Cleaning UK <verified-sender@example.com>`.
- Configurable SMTP host, port, username, password, and timeout.
- Default Brevo-friendly port `2525`.
- Automatic retry on port `2525` when port `587` is configured but unreachable.
- Mocked success/failure regression tests.

Required production variables are described in the next section. `SMTP_PASSWORD` must be a Brevo SMTP key, not a normal email password and not a frontend-exposed API value. The Brevo sender/domain must be verified before sending to arbitrary customer recipients.

> **Documentation drift note:** Some historical files, especially the original `backend/README.md` and older deployment notes, still mention Resend or Hugging Face. The active implementation and current deployment path are Brevo SMTP plus Railway. `backend/LOCAL_ENV_TEMPLATE.md` is the current source for the SMTP variable names and defaults.

---

## 15. Environment variables

### 15.1 Frontend

Create a private root `.env.local` for local development:

```dotenv
VITE_API_BASE_URL=http://localhost:8000
```

For production, use the Railway public backend domain without `/api/v1`:

```dotenv
VITE_API_BASE_URL=https://brightnestcleaning-production.up.railway.app
```

Only public frontend configuration belongs in a `VITE_` variable. Never put `DATABASE_URL`, `JWT_SECRET`, `SMTP_PASSWORD`, `SMTP_USERNAME`, `REDIS_URL`, admin passwords, or private API keys in frontend variables.

### 15.2 Backend

| Variable | Purpose | Typical production value/source |
| --- | --- | --- |
| `APP_ENV` | Runtime mode | `production` |
| `DATABASE_URL` | Neon PostgreSQL connection | Private Neon pooled URL with SSL options. |
| `JWT_SECRET` | JWT signing secret | New random secret of at least 32 characters. |
| `JWT_ALGORITHM` | JWT algorithm | `HS256` unless deliberately changed. |
| `ACCESS_TOKEN_MINUTES` | Admin access-token lifetime | `15` by default. |
| `REFRESH_TOKEN_DAYS` | Admin refresh-token lifetime | `7` by default. |
| `CUSTOMER_MAGIC_LINK_MINUTES` | Customer link lifetime | `30` by default. |
| `BOOKING_SLOT_CAPACITY` | Concurrent booking capacity per slot | `1` for the current configuration unless business capacity changes. |
| `COVERAGE_POSTCODE_PREFIXES` | Server-authoritative service area | Confirmed comma-separated prefixes such as `B6,B7,B8`; do not claim ranges not served. |
| `FRONTEND_BASE_URL` | Base URL for customer links | `https://brightnestcleaning.vercel.app` |
| `ALLOWED_ORIGINS` | CORS allow-list | Exact Vercel frontend origin. |
| `TRUSTED_HOSTS` | Host validation | Exact Railway public hostname plus required healthcheck host where applicable. |
| `ADMIN_NOTIFICATION_EMAIL` | Team notification recipient | BrightNest operational inbox. |
| `EMAIL_FROM` | Verified SMTP sender | `BrightNest Cleaning UK <verified-sender@your-domain.example>` |
| `SMTP_HOST` | SMTP relay | `smtp-relay.brevo.com` |
| `SMTP_PORT` | SMTP relay port | `2525` recommended for Railway fallback. |
| `SMTP_TIMEOUT_SECONDS` | Connection timeout | `15` by default. |
| `SMTP_USERNAME` | Brevo SMTP login | Private Brevo SMTP login. |
| `SMTP_PASSWORD` | Brevo SMTP key | Private masked Railway variable. |
| `BOOTSTRAP_ADMIN_EMAIL` | Initial admin email | Private admin email used only for bootstrap. |
| `BOOTSTRAP_ADMIN_PASSWORD` | Initial admin password | Unique 12+ character password. |
| `REDIS_URL` | Optional shared Redis | Managed TLS Redis URL, if available. |
| `ENABLE_DOCS` | FastAPI docs switch | `false` in production. |
| `LOG_LEVEL` | Server log level | `INFO`. |

Railway supplies `PORT` automatically. Do not hard-code a conflicting public port in Railway variables. The startup script reads the injected port and binds Uvicorn to `0.0.0.0`.

---

## 16. Local development and validation

### 16.1 Backend setup

From the repository root:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Copy the safe template into a private file and fill in local values:

```bash
cp LOCAL_ENV_TEMPLATE.md /tmp/brightnest-env-template-review.md
# Create backend/.env manually from the dotenv block.
```

Do not commit `backend/.env`. Apply migrations, bootstrap the optional local admin, and start the API:

```bash
alembic upgrade head
python -m app.bootstrap
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Health check:

```text
http://localhost:8000/health
```

Backend tests:

```bash
pytest -q
```

### 16.2 Frontend setup

From the repository root:

```bash
pnpm install
pnpm dev
```

The frontend normally runs at `http://localhost:3000`. Set `VITE_API_BASE_URL=http://localhost:8000` in a private root `.env.local` for local API integration.

### 16.3 Frontend checks

```bash
pnpm run check
pnpm run build
```

`pnpm run check` runs TypeScript validation. `pnpm run build` builds the Vite frontend and bundles the small server bridge. A warning remains for a shared JavaScript chunk over 500 kB; the build itself succeeds.

---

## 17. Deployment workflow

### 17.1 Vercel frontend

The frontend is a Vite static application. Vercel must build the repository root and serve the generated `dist/public` output according to the project’s deployment configuration. The SPA fallback is important because direct navigation to `/admin`, `/dashboard`, `/blog`, and `/blog/:id` must load the React application instead of returning a platform-level 404.

The production frontend must contain:

```dotenv
VITE_API_BASE_URL=https://brightnestcleaning-production.up.railway.app
```

After changing that variable, trigger a fresh production deployment. Do not add `/api/v1` to the variable because the frontend API helper appends the path internally.

### 17.2 Railway backend

Railway should deploy from the GitHub repository’s `main` branch with:

| Setting | Value |
| --- | --- |
| Repository | `muhammaduzair56/BrightnestCleaning-` |
| Root Directory | `backend` |
| Start command | `sh scripts/start.sh` |
| Healthcheck path | `/health` |
| Builder | Railway default/Nixpacks or the included Docker configuration, according to the active service setup |
| Public domain | Generated Railway HTTPS domain |

After adding variables, deploy and verify:

```text
https://YOUR-RAILWAY-DOMAIN.up.railway.app/health
```

Expected response:

```json
{"status":"ok","service":"brightnest-api"}
```

Then test admin login, availability, booking creation, customer magic-link request, and SMTP notification logs. A successful booking can still return `201 Created` if email delivery fails in the background, so SMTP delivery must be checked separately in Railway logs and the Brevo event dashboard.

### 17.3 Deployment order

Use this order when making a backend or integration change:

1. Run backend tests and frontend typecheck/build locally.
2. Confirm no secret file or credential is tracked.
3. Push the validated code to GitHub `main`.
4. Confirm Railway detects the backend change and completes migrations.
5. Verify `/health`.
6. Verify the Vercel frontend’s `VITE_API_BASE_URL` still targets the current Railway domain.
7. Run a non-destructive booking and customer-dashboard test.
8. Check notification delivery and provider logs.
9. Save a recoverable project checkpoint before publishing or handing off the release.

---

## 18. QA and verification status

The implemented release has been validated through the following checks:

| Area | Result |
| --- | --- |
| Frontend TypeScript | Passed with `pnpm run check`. |
| Frontend production build | Passed with `pnpm run build`. |
| Backend regression suite | Passed; the latest SMTP timeout remediation suite reached 15 passing tests before subsequent frontend-only blog work. |
| SMTP behaviour | Mocked success/failure tests cover non-blocking delivery, configured timeout, and port-587-to-2525 fallback. |
| Availability | Public availability route and active-versus-cancelled slot behaviour tested. |
| Booking concurrency | PostgreSQL transaction/advisory locking protects fully booked slots. |
| Admin auth | Login, protected route handling, refresh/session behaviour, and unauthorised responses exercised. |
| Customer auth | Magic-link request/exchange, customer scoping, expiry/reuse protections covered. |
| Receipts | ReportLab PDF generation and customer-scoped receipt access covered. |
| Admin analytics | Revenue/cancellation trend data, date filtering, service filtering, empty states, and mobile rendering validated. |
| Blog | `/blog`, article route, eight-card index, structured article layout, SEO metadata implementation, sharing UI, desktop preview, and mobile preview validated. |
| Responsive UI | Public pages and dashboards reviewed at desktop and phone-sized viewports. |
| Secret safeguards | `.gitignore` excludes `.env`, build artifacts, caches, and local runtime material; safe templates contain placeholders only. |

### Recommended production smoke tests

After every production deploy, submit one test booking using a controlled test email, verify the booking appears in Admin, verify the expected SMTP admin notification, request the customer magic link, verify the customer dashboard loads only that customer’s bookings, update a test amount using consistent pence values, mark the booking completed, and download the customer receipt. Do not use real customer data for repeated QA.

---

## 19. Current limitations and important behaviour

1. **No automatic card checkout is active.** Payment metadata is manually entered by an admin. Customer card collection requires Stripe Checkout and webhook work.
2. **Revenue semantics depend on the analytics date window.** A paid and completed future booking may not appear in a default “up to today” preferred-visit-date window. Include the booking date in the filter or change the aggregation to use `paid_at` for cash-received reporting.
3. **Email delivery is asynchronous.** Booking creation can succeed while notification delivery later fails; production monitoring should alert on SMTP failures.
4. **Blog metadata is client-rendered.** Social crawlers that do not execute JavaScript may see base HTML metadata rather than route-specific article metadata. A future SSR/prerender strategy would improve crawler reliability.
5. **The shared JavaScript chunk remains above Vite’s 500 kB warning threshold.** The build succeeds, but further manual chunking or dependency reduction can improve first-load performance.
6. **Referral validation is present but should be connected to a real quote/payment redemption flow before advertising live discounts.**
7. **Recurring materialisation needs a trusted scheduler.** The protected recurring endpoint exists, but production should invoke it through a controlled Railway cron/heartbeat job with admin authentication.
8. **Review integrations are prepared as links/settings, not fabricated live reviews.** Google Reviews or Trustpilot content should only be shown from a verified source or a compliant provider integration.
9. **The current backend README contains historical Resend/Hugging Face language.** The active deployment documentation should be consolidated around Brevo SMTP and Railway.
10. **The current static frontend has no CMS.** Blog articles are source-controlled records; a non-developer content editor would need a future CMS or admin content workflow.

---

## 20. Payment roadmap

The current safe manual workflow is suitable for quote review and bank-transfer/cash reconciliation, but it is not an online payment gateway. The recommended production payment implementation is:

```text
Customer booking request
        ↓
Admin reviews scope and confirms quote
        ↓
Backend creates a Stripe Checkout Session
        ↓
Customer pays on Stripe-hosted checkout
        ↓
Stripe webhook verifies payment server-to-server
        ↓
Booking payment_status becomes paid
        ↓
paid_at, provider, reference, subtotal/tax/total are recorded
        ↓
Customer receipt/dashboard updates
```

The future implementation must verify webhook signatures, make webhook handling idempotent, never trust a frontend “paid” flag, avoid storing card data, and keep payment-provider secrets server-side. Stripe should be added through the project’s supported feature setup rather than by exposing keys in the React bundle.

---

## 21. Recommended future improvements

| Priority | Future feature | Why it matters |
| --- | --- | --- |
| High | Stripe Checkout plus verified webhooks | Converts the current manual payment metadata into a real secure online payment journey. |
| High | Revenue reporting by `paid_at` plus preferred visit date | Separates cash-received reporting from scheduled-service reporting. |
| High | SMTP delivery status table, retry queue, and alerting | Makes background notification failures visible to the admin instead of relying only on logs. |
| High | Production cron for recurring visits | Materialises weekly/fortnightly/monthly plans reliably without manual invocation. |
| Medium | CMS-backed blog editor | Lets the business publish articles without changing source code. |
| Medium | Blog category filter and search | Makes eight or more articles easier to browse as the journal grows. |
| Medium | Server-rendered or prerendered SEO pages | Improves metadata reliability for social crawlers and search engines. |
| Medium | Google Business Profile or Trustpilot integration | Adds live trust signals while preserving the no-fabricated-review rule. |
| Medium | Admin user management and role permissions | Supports multiple staff members with least-privilege access. |
| Medium | Automated customer email templates and delivery history | Gives customers clearer confirmation, reminder, cancellation, and receipt communications. |
| Medium | Better analytics export | Allows CSV export of booking, revenue, cancellation, and service-performance data. |
| Low | Further bundle splitting and image optimisation | Reduces initial JavaScript and improves Core Web Vitals. |
| Low | Availability calendar view for admins | Gives operations staff a visual capacity overview rather than relying only on list data. |

---

## 22. Operational runbook

### If Railway healthcheck fails

Open deployment logs and confirm the process reaches migration completion, bootstrap completion, and Uvicorn startup. Check that Railway’s `PORT` is being used, `TRUSTED_HOSTS` contains the public hostname, `DATABASE_URL` is valid and unquoted, and the health path is exactly `/health`. A `400` from `/health` usually indicates trusted-host validation; a service-unavailable result usually indicates process startup failure or port binding failure.

### If booking creation works but email does not arrive

Check `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`, and `EMAIL_FROM`. Use port `2525` on Railway when port `587` times out. Confirm the Brevo sender is verified and that the SMTP password is a Brevo SMTP key. Check Railway logs for timeout, authentication, sender-format, or recipient restrictions and check Brevo event logs for provider-side rejection.

### If the admin page returns 401

A first `401` during page loading can occur if the frontend requests protected data before the token is restored. A subsequent `200` after successful login confirms the backend is working. If all requests remain `401`, sign in again, clear the browser session for the site, verify the frontend points to the correct backend, and inspect the access-token/refresh-token flow.

### If the revenue card shows £0.00

First verify that the booking has a valid saved total, `Paid` payment status, and `Completed` booking status. Then include the booking’s preferred visit date in the analytics date range if the current report is visit-date based. If the business wants cash-received reporting, update the analytics rule to aggregate by `paid_at`.

### If Vercel direct routes return 404

Confirm the SPA rewrite is deployed, the Vercel project is connected to the correct GitHub repository and `main` branch, and the build output is the configured `dist/public` directory. Redeploy after configuration changes and test `/admin`, `/dashboard`, `/blog`, and `/blog/<article-id>` directly in a fresh browser tab.

---

## 23. Source references inside this repository

The following files are the primary implementation references for this report:

1. [`client/src/App.tsx`](client/src/App.tsx) — frontend route registration and providers.
2. [`client/src/pages/Home.tsx`](client/src/pages/Home.tsx) — public UI, service catalogue, booking journey, validation, FAQs, trust content, and pricing preview.
3. [`client/src/pages/Blog.tsx`](client/src/pages/Blog.tsx) — eight article records, article routes, dynamic SEO metadata, and share controls.
4. [`client/src/pages/Admin.tsx`](client/src/pages/Admin.tsx) — protected admin UI, analytics, payment editing, and status actions.
5. [`client/src/pages/Dashboard.tsx`](client/src/pages/Dashboard.tsx) — customer access, booking groups, change requests, receipts, and data controls.
6. [`backend/app/main.py`](backend/app/main.py) — FastAPI application, middleware, health endpoint, and router registration.
7. [`backend/app/routers/auth.py`](backend/app/routers/auth.py) — admin authentication endpoints.
8. [`backend/app/routers/bookings.py`](backend/app/routers/bookings.py) — availability, booking creation, admin operations, recurring runs, analytics, and dashboard counters.
9. [`backend/app/routers/customer.py`](backend/app/routers/customer.py) — magic links, customer bookings, receipts, change requests, and data requests.
10. [`backend/app/models.py`](backend/app/models.py) — database tables, enums, relationships, and indexes.
11. [`backend/app/config.py`](backend/app/config.py) — typed environment configuration and safe defaults.
12. [`backend/app/notifications.py`](backend/app/notifications.py) — Brevo SMTP delivery and fallback handling.
13. [`backend/app/receipts.py`](backend/app/receipts.py) — PDF receipt generation.
14. [`backend/LOCAL_ENV_TEMPLATE.md`](backend/LOCAL_ENV_TEMPLATE.md) — safe local and SMTP variable template.
15. [`backend/RAILWAY_DEPLOYMENT.md`](backend/RAILWAY_DEPLOYMENT.md) — Railway setup and production verification.
16. [`LOCAL_SETUP.md`](LOCAL_SETUP.md) — local setup and validation commands.
17. [`vercel.json`](vercel.json) — frontend SPA/deployment configuration.

---

## 24. Final handover summary

BrightNest Cleaning UK currently has a production-oriented public website, a working booking API, secure admin and customer access paths, real database persistence, availability protection, operational analytics, PDF receipts, recurring-booking foundations, data-request handling, responsive editorial content, and SMTP-based notifications. The main production items still requiring a deliberate business decision are automatic payments, cash-received revenue semantics, production scheduling for recurring visits, and final cleanup of historical documentation that still references Resend or Hugging Face.

The safe project archive should include source code, migrations, tests, documentation, configuration templates, and deployment files while excluding all credentials, `.env` files, dependency directories, build output, caches, logs, and machine-specific project metadata.
