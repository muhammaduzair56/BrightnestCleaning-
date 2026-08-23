# Live QA findings

- Checked `https://brightnestcleaning-production.up.railway.app/health` on 2026-08-23: returned `{"status":"ok","service":"brightnest-api"}`.
- Checked `https://brightnestcleaning-production.up.railway.app/api/v1/availability?preferred_date=2026-09-01`: returned the expected 10 time slots, each with `value`, `label`, `description`, and `available: true`.
- No booking was created or modified during these checks.

## Public routes

The live Vercel homepage rendered successfully with the BrightNest header, service catalogue, add-on cards, booking CTA, booking form controls, FAQ links, and footer. The live Blog route rendered successfully with its shared header, original article imagery, four article cards, CTA, and footer links. No missing route content was observed in the extracted page content.

## Booking route and API

The live booking section rendered with service selection, bedroom and bathroom selectors, bin-cleaning control, price summary, visit rhythm, preferred date, preferred time, and Continue controls. The date trigger was found in the live DOM and its click handler was invoked without submitting a request. The live availability API returned valid slot objects for 1 September 2026. No booking submission was performed.

## Picker interaction

The live date picker opened successfully. It displayed Soonest, Tomorrow, and In 3 days quick choices, plus One-off, Weekly, Bi-weekly, and Monthly recurrence controls and an accessible calendar with future date labels. Selecting Bi-weekly visibly changed the selected state. No booking was submitted.

The live date picker opened and showed future calendar dates, quick date choices, and recurrence controls. Selecting Bi-weekly changed the visible selected state, and selecting the next day updated the booking form to Mon 24 August. The live time picker then opened with 10 readable daytime slots and availability guidance; no booking was submitted.

## Protected routes

The live `/admin` route displayed an authentication gate with email and password fields and no booking data. The live `/dashboard` route displayed the customer magic-link request gate with an email field and no customer booking data. No credentials were entered and no email or booking action was submitted.

## Legal routes

The live Privacy Policy route rendered successfully with its privacy summary, contact link, and ICO resource link. The live Terms of Service route rendered successfully and included booking confirmation, cancellation, refund, no-access, and online-booking sections. Both routes had working return navigation and no route errors were observed.

## Final live checks

The production HTTP checks returned 200 for `/`, `/blog`, `/admin`, `/dashboard`, `/privacy-policy`, `/terms-of-service`, the Blog hero WebP asset, Railway `/health`, and the Railway availability endpoint. The browser console showed no uncaught console output during the route checks.

The QA pass intentionally did not submit a booking, request a magic link, enter admin credentials, or perform any destructive operation. Those authenticated and email-dependent flows remain manual acceptance tests.
