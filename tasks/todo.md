# Task List: Additional Cleaning Services

**Status:** Complete on 2026-10-11 on branch `feat/additional-cleaning-services-20261011` from `origin/main`; not merged or deployed. The live database and website are unchanged.\
**Source:** [`../SPEC-additional-cleaning-services.md`](../SPEC-additional-cleaning-services.md) and [`plan.md`](plan.md).\

## Ordered Outcomes

- [x] **Task 1 — Structured request contract and backward-compatible persistence.** Added typed `additional_services`, server validation, nullable JSON booking storage and additive Alembic revision. Legacy `bin_cleaning` remains compatible. Existing booking rows are not rewritten; legacy null values normalize to empty structured details.\
  **Evidence:** `test_additional_services_migration_preserves_legacy_booking_data` confirms all seeded pre-existing columns and values are unchanged and the new column is nullable/NULL for the legacy row; Alembic reports one head, `20261011_0009`.

- [x] **Task 2 — Booking persistence and recurring rule.** Booking requests persist and return selected service details to protected Admin APIs. Bin repeats only when its own frequency is `Recurring` and the main visit is recurring; other selected services do not repeat. A Bin recurrence choice on a one-off main request does not create a separate plan.\
  **Evidence:** API tests cover saved/returned structured data, Bin as main service, validation, recurring Bin copies, one-off Bin omission and no separate schedule for a one-off main booking.

- [x] **Task 3 — Staff-facing details.** Protected Admin booking detail and internal new-booking notification email show structured service details. Email free text is HTML-escaped.\
  **Evidence:** API and notification tests passed; local Admin UI was exercised with synthetic login/API responses and showed Bin count/types, collection day/frequency, and additional-service details.

- [x] **Task 4 — Unified Step 1 UI.** Added the optional 11-choice multi-select with relevant conditional fields; primary Bin hides its duplicate checkbox while retaining Bin details. Existing three steps, main service/property/frequency/date/time/contact/notes flow remain. The calculator stays disabled, quote-only text remains, and no extra-service prices or starting rates were changed.\
  **Evidence:** Local browser checks selected all 11 choices, saw 10 non-Bin panels and conditional Bin fields, verified two individual Bin inputs and primary/add-on behavior, and confirmed `Quote required` with no calculated total. Blank `Other` description blocked Step 1; providing it allowed continuation. A full mock booking flow captured all selected services/details in the POST payload, including date/time/contact/notes, with no price/total fields; all network calls were intercepted at a dummy test origin.

- [x] **Task 5 — Integrated verification and closeout.** No real customer booking was submitted; no production database migration, merge, or deployment occurred. Branch publication and PR review do not apply changes to production.\
**Results:** Backend `pytest -q`: **23 passed**, 2 non-blocking dependency deprecation warnings. Frontend `pnpm check`: passed. Clean-environment `pnpm build`: passed; final bundle excludes the temporary test API origin. `alembic heads`: one head, `20261011_0009`. `git diff --check`: passed.

## Outstanding Issues

No feature/test failures remain. The backend test run reports two dependency deprecation warnings (`crypt` and Starlette/AnyIO). pnpm also reports a pre-existing `package.json` configuration warning because current pnpm ignores `pnpm.patchedDependencies` and `pnpm.overrides`; package configuration was not changed. Live rollout remains intentionally pending separate user approval.

## Mobile Simplicity Refinement (2026-10-11)

- [x] Keep current three-step flow and all current fields; no new main-service question profiles or database changes.
- [x] Render the optional add-on choices compactly for mobile with ≥44px row/tap height, keep details conditional, and show neutral guidance until a main service is chosen.
- [x] Test at 390×844 for horizontal overflow, legibility, skipped add-ons, one and multiple selected detail panels, and deselection. Re-run backend suite, frontend typecheck, and production build; do not deploy.

**Evidence:** At 390×844 the page width remained 390px with no horizontal overflow. The optional section measured 487px high; all 11 choices fit a 134px two-column grid, with 44–66px choice rows. No service details were visible initially; Kitchen-only, Kitchen+Bin, and Kitchen deselection (Bin retained) showed the expected conditional panels. Backend schema validation accepted both an omitted `additional_services` field and an explicitly empty selection; the request builder submits an empty `items` list when no add-on is selected. The quote message remained visible without a calculated total. Final mobile section screenshot: `/tmp/brightnest-additional-section-mobile-final.png`.
