# Implementation Plan: Additional Cleaning Services

**Status:** Approved by user on 2026-10-11; implementation authorized\
**Approved spec:** [`SPEC-additional-cleaning-services.md`](../SPEC-additional-cleaning-services.md)\
**Baseline:** `origin/main` / `d6a6a95c8043a3d197d276fa14a0662a2a08e6c9`\
**Deployment:** Out of scope; do not merge or deploy without separate user approval.

## Scope

Deliver one end-to-end capability: collect optional additional cleaning services and their conditional details in Step 1, validate and persist the structured request, and show it in protected Admin booking detail and internal booking notification email. Keep the form compact and responsive at mobile widths while preserving the existing three steps and fields. Preserve existing booking behavior, starting rates, `Quote required`, disabled calculator, and all unrelated features.

## Components and Dependencies

| Component | Responsibility | Depends on |
|---|---|---|
| Booking data contract | Typed service-specific payload/read fields, legacy-bin compatibility, nullable JSON persistence, Alembic migration | Approved spec |
| Booking workflow | Validate and save new fields; preserve data in Admin API; apply Bin-specific recurring rule | Booking data contract |
| Staff surfaces | Render request details in Admin detail and internal notification email | Booking response/data contract |
| Customer form | Multi-select, per-service conditional fields, optionality/defaults, quote-only behavior | Agreed payload contract |
| Verification | Migration-preservation test, API/UI combinations, notifications/Admin, full tests and build | All implementation components |

## Dependency Graph and Build Order

```text
Approved spec
   ↓
A. Contract + nullable JSON model/migration + legacy-data preservation test
   ↓
B. Booking API persistence/serialization + recurrence behavior + API tests
   ├──────────────→ C. Admin detail + internal email + rendering tests
   └──────────────→ D. Booking form + typed API payload + interaction checks
                          ↓
E. Integrated regression checks, production build, local visual verification
```

The frontend and staff surfaces can proceed in parallel after the payload/read contract is stable, but integration verification must follow all three. The user’s explicit “no live deploy” boundary applies throughout.

## Ordered Implementation Tasks (for after plan approval)

1. **Establish isolated feature branch.** Start from the verified latest `origin/main`; carry the approved specification and this plan onto it. Confirm clean working tree and correct base SHA. Do not edit `main`, push, merge, or deploy.
2. **Define and persist the structured contract.** Add Pydantic detail models/validation, SQLAlchemy nullable JSON field, API TypeScript types, and one additive Alembic revision. Keep legacy `bin_cleaning` behavior consistent. Add a migration regression test that starts with an existing booking and proves the new column addition leaves all previous values intact. **Checkpoint:** migration head is unique; isolated upgrade succeeds; prior row values compare equal.
3. **Wire booking creation and recurring behavior.** Persist/read the structured field through the public booking endpoint and protected Admin API. Keep legacy payloads/read models compatible. Copy Bin details into generated visits only when the main booking recurs and Bin frequency is Recurring; do not carry other extras forward. **Checkpoint:** API tests cover primary Bin, Bin add-on, multiple extras, blank optional fields, malformed values, old records, and recurring/one-off cases.
4. **Expose details to staff.** Extend protected Admin booking detail with a readable summary of primary/additional services and their details. Extend only the internal new-booking email with the same structured summary; HTML-escape user-entered text. **Checkpoint:** tests assert the complete saved details appear in both staff outputs and unsafe HTML is escaped.
5. **Implement Step 1 customer UI.** Replace the separate bin checkbox with the unified multi-select. Preserve primary Bin Cleaning while hiding its duplicate add-on choice and retaining bin fields in the section. Add all selected service-specific fields, optionality/defaults and removal of deselected data. Keep the current three-step flow and submit typed structured details. Render the optional choices as a compact two-column mobile grid with ≥44px row height; show only selected detail panels and replace the empty-service specialist message with neutral guidance. Preserve every field and do not introduce new main-service question profiles in this bounded pass. Do not edit price values or enable calculation. **Checkpoint:** typecheck/build pass; local browser checks cover all choices, combinations, and mobile layout.
6. **Integrated verification.** Run the complete backend suite, frontend checks and production build; exercise an isolated test database migration with legacy rows; verify booking requests, Admin, email, recurring behavior, all price-display assertions, and 390×844 mobile behavior (including no horizontal overflow and conditional detail visibility). Test only local/test data; do not submit a real customer booking. Record changed files and exact results.

## Anticipated File Scope

- `client/src/pages/Home.tsx`
- `client/src/lib/api.ts`
- `client/src/pages/Admin.tsx`
- `backend/app/schemas.py`
- `backend/app/models.py`
- `backend/app/routers/bookings.py`
- `backend/app/notifications.py`
- `backend/migrations/versions/<new_revision>_booking_additional_services.py`
- `backend/tests/test_foundation.py`
- `backend/tests/test_notifications.py`
- A focused migration regression test under `backend/tests/` if the existing fixtures do not support a migration-level preservation test

No new package/dependency is planned. The exact touched-file list may be narrowed if current test utilities provide an existing appropriate migration fixture; any material scope expansion will be surfaced first.

## Verification Commands and Evidence

- Frontend: `pnpm check` and `pnpm build`.
- Backend: `cd backend && pytest -q`.
- Migration: `cd backend && alembic heads`, then upgrade an **isolated test database** to head. Compare all pre-existing booking fields before/after; no production URL or live DB upgrade will be used.
- Local UI: inspect Step 1 in the local preview and test Bin as primary/add-on, multiple services, deselection, optional fields, and quote-only display. At 390×844, check compact two-column checkboxes, ≥44px rows, field wrapping, no horizontal overflow, neutral no-service guidance, and that no unselected detail panel is visible. Do not send a live booking.
- Staff: inspect the Admin detail payload/render and captured internal-email HTML from tests; verify all details and escaping.
- Repository: verify only intended files changed, calculator flag remains false, displayed starting rates are unchanged, and the feature branch is not merged/deployed.

## Main Risks and Mitigations

- **Legacy booking/API compatibility:** Keep the old boolean, make the new column nullable, normalize null legacy values to empty details at read time, and include a before/after migration test.
- **Conditional state leakage:** Clear or omit a service’s values when deselected; test multiple toggles and submitted JSON.
- **Mobile density/legibility:** A two-column list can wrap long labels; preserve ≥44px touch rows and check 390×844 before/after. Use only existing brand tokens and do not compress detail fields into unreadable columns.
- **Duplicate Bin representation:** Treat the primary Bin service as the same Bin details group, hide only the duplicate add-on choice, and test both primary/add-on modes.
- **Untrusted details in email:** Validate on the server and HTML-escape all customer-provided text.
- **Recurring extras accidentally repeating:** Add explicit tests for Bin One-off/Recurring and ensure all non-bin add-ons are omitted from generated visits.
- **Price behavior regression:** Keep the existing calculator off-switch untouched and assert no calculated totals/add-on prices while rates and quote copy remain unchanged.
- **Production data/deployment risk:** The migration is additive and nullable, but this plan explicitly excludes applying it to production and excludes live deployment.

## Boundaries

- **Always:** Follow the approved spec exactly; preserve existing form steps, fields, notes, quote-only display, service rates, and branding; validate the details server-side; verify existing records are preserved.
- **Ask first:** Any production database migration, push/merge/deployment, pricing or recurrence scope change, new dependencies, or unrelated files/features.
- **Never:** Deploy the change, calculate or add prices, remove the primary Bin Cleaning option, or change unrelated website functionality.

## Review Gate

Plan approved by the user on 2026-10-11. The bounded task list is in `tasks/todo.md`; implementation proceeds under the approved plan and remains local/unmerged/unpublished unless the user separately approves.
