# Spec: Additional Cleaning Services in Booking Form

**Status:** Approved by user on 2026-10-11; implementation authorized\
**Repository:** `muhammaduzair56/BrightnestCleaning-`\
**Baseline inspected:** `main` at `d6a6a95c8043a3d197d276fa14a0662a2a08e6c9`\
**Scope:** Step 1 booking-form additions, structured request submission/persistence, and staff visibility only.

## Objective

Allow a customer to select one or more optional additional cleaning services in **Step 1** of the existing three-step booking form, see only the relevant detail fields for the selected services, and submit the selections and entered details with the booking enquiry so BrightNest staff can see the complete request.

Keep the existing main service, bedrooms, bathrooms, main visit frequency, preferred date and time, three-step process, “Your Details” step, and final optional notes field. Additional services must not add or calculate prices. The calculator stays disabled, **“Quote required”** remains displayed, and all published service starting rates remain unchanged.

## Confirmed Product Decisions

1. **Bin Cleaning remains in the main-service picker.** If Bin Cleaning is the main service, hide its duplicate choice from the Additional Cleaning Services multi-select but show all bin-specific fields in the unified section. If another main service is selected, Bin Cleaning is available as an additional-service choice.
2. Remove the separate **“Add bin cleaning”** checkbox. The unified section is the sole place for bin details; the primary-service choice remains available for customers seeking bin cleaning alone.
3. Additional-service selections remain optional. The entire section can be skipped. Fields appear only for a selected additional service, or for Bin Cleaning when it is the primary service. Optional fields can remain blank; service-specific defaults are provided where appropriate so counts do not block submission. “Other” requires a description when selected.
4. Preserve the existing `bin_cleaning` boolean for older booking records/clients; new requests set it consistently with the primary service or the selected Bin Cleaning add-on.
5. Structured request details must be validated and saved with the booking, and shown in the protected Admin booking detail and internal new-booking notification email. Existing customer confirmation-email detail content is outside scope.
6. A nullable structured JSON field and additive Alembic migration are required. The migration only adds the new column: it must not update, delete, or rewrite existing booking rows, IDs, notes, service selections, legacy `bin_cleaning` values, or financial records. Older rows remain readable with empty structured details.
7. No new price, charge, calculator behavior, branding change, or unrelated feature is included.

## Form Behavior

### Additional Cleaning Services section

Add one multi-select section in **Step 1**, with these choices:

1. Bin cleaning
2. Kitchen deep cleaning
3. Single oven cleaning
4. Double oven cleaning
5. Fridge/freezer cleaning
6. Inside window cleaning
7. Carpet/rug cleaning
8. Sofa/upholstery cleaning
9. Mattress cleaning
10. Washing machine cleaning
11. Other

Customers may select multiple choices. Each active choice shows only its own fields. The same service may not appear twice in the form. If the primary service is Bin Cleaning, hide its add-on choice and show the bin fields in this section as the primary service’s details; all other additional choices remain available. If the primary service is not Bin Cleaning, show Bin Cleaning as a selectable add-on.

When an additional choice is deselected, hide its fields and omit its selection and detail values from the submitted request. Unselected choices do not require any fields. The existing main form fields and three-step flow remain functional.

### Conditional fields and optionality

| Service | Relevant fields shown when active | Requiredness/default behavior |
|---|---|---|
| **Bin cleaning** | Number of bins; an individual colour/type entry for each bin; collection day; Bin Cleaning frequency; optional notes. | Number defaults to 1 and can be changed (1–50). Each bin gets a separate colour/type input; it may be left blank if unknown. Collection day is optional. Frequency is a separate choice, defaults to **One-off**, and can be changed to **Recurring**. Notes are optional (max 1,000 characters). |
| **Kitchen deep cleaning** | Optional description of kitchen requirements. | Optional (max 1,000 characters); customers may submit without extra kitchen notes. |
| **Single oven cleaning** | Single-oven choice and number of single ovens. | The choice identifies the oven type; quantity defaults to 1 and can be changed (1–20). |
| **Double oven cleaning** | Double-oven choice and number of double ovens. | The choice identifies the oven type; quantity defaults to 1 and can be changed (1–20). Single and double options may both be selected if applicable. |
| **Fridge/freezer cleaning** | Appliance type (fridge, freezer, or combined fridge/freezer) and quantity. | Quantity defaults to 1 and can be changed (1–20). Appliance type is optional if the customer is unsure. |
| **Inside window cleaning** | Number of windows and requested side(s): inside, outside, or both. | Quantity defaults to 1 and can be changed (1–100). Side defaults to **Inside** and can be changed to outside or both. |
| **Carpet/rug cleaning** | Number of rooms and/or items; optional item/area description. | Room and item counts are optional (each 1–100); the customer may provide either, both, or neither and BrightNest can clarify the scope. Description is optional (max 1,000 characters). |
| **Sofa/upholstery cleaning** | Sofa/upholstery type (sofa, armchair, or other) and number of seats; optional explanation for “other”. | Type defaults to **Sofa** and can be changed. Seat count is optional (1–100). “Other” explanation is optional (max 1,000 characters). |
| **Mattress cleaning** | Quantity and mattress size (single, double, king, super king, or other). | Quantity defaults to 1 and can be changed (1–20). Size is optional. |
| **Washing machine cleaning** | Quantity and appliance type (front-loader, top-loader, washer-dryer, or other). | Quantity defaults to 1 and can be changed (1–20). Appliance type is optional. |
| **Other** | Description of the requested service. | Required only when “Other” is selected (max 1,000 characters). |

Except for the “Other” description, a customer can submit with appropriate optional details blank; defaults above provide a usable baseline for quantity/type where specified. This does not prevent the BrightNest team from following up to clarify a quote. The server still validates any values that are supplied, including types, ranges, and text limits.

Bin Cleaning’s One-off/Recurring frequency is separate from the main visit frequency. The main booking’s date, time, and visit frequency remain unchanged.

### Short, adaptive, mobile-friendly form

- Keep the existing three-step flow and all current main-service, bedroom/bathroom, visit-frequency, preferred-date/time, contact, and optional-notes fields. Do not add a step or remove a current field.
- Keep Additional Cleaning Services as one compact, optional checkbox section. Customers may skip the section entirely without blocking or changing the main booking submission.
- Display service-specific controls only for selected additional services. Unselected services have no visible detail controls; deselected services and their detail values are omitted from the request. Do not show all service detail groups at once.
- Keep follow-up details minimal; fields remain optional except the already specified “Other” description. Do not prompt again for main form values or invent additional primary-service questions as part of this mobile layout refinement.
- Preserve current primary-service bedroom/bathroom gating. Before a main service is chosen, show a neutral instruction rather than describing a specialist service as already selected.
- At the small-mobile acceptance viewport (390×844), present the checkbox choices in a compact two-column responsive grid with at least 44px row/tap height, readable wrapping, and no horizontal overflow. Keep detail inputs stacked at narrow widths; normal vertical scrolling is expected for a multi-field form and must not be replaced by an extra step or a screen containing every service’s detail fields.
- Do not change payload fields, database schema, booking records, pricing, the disabled calculator, quote wording, or the three-step flow for this layout refinement.

## Submission, Validation, and Persistence

- The frontend submits `additional_services` as a structured object:
  - `bin_cleaning`: `null` when no bin clean was requested; otherwise the bin details above. It is used whether Bin Cleaning is the primary service or an add-on. The existing `service_type` distinguishes primary Bin Cleaning from an add-on.
  - `items`: an array of other selected services. Each item contains the exact service label and its service-specific details. Blank optional values are omitted or stored as `null`; defaults are submitted as values.
- The legacy `bin_cleaning` boolean remains in the request/model for compatibility. It is true when `service_type` is `Bin cleaning` or `additional_services.bin_cleaning` is present; otherwise false. It is not a separate customer-facing control.
- Add typed details to the frontend `BookingPayload`, backend `BookingCreate`/`BookingRead`, and SQLAlchemy `Booking` model. Server-side Pydantic validation checks allowed service labels, field types, ranges, required “Other” description, and text limits. Malformed or inconsistent data receives the API’s standard validation response.
- Use a new additive Alembic revision to add only a nullable JSON column. Do not backfill or rewrite existing records. When reading a legacy booking whose new column is null, normalize it to an empty structured value; preserve every existing field and value.
- Save the submitted structured details together with the booking enquiry. Keep the existing final notes field independent; do not merge, overwrite, or truncate it with service details.
- Display the complete selected services and associated details in the protected Admin booking detail and internal new-booking email. Escape free text in email output.

## Recurring Behavior

For future visits generated by an existing recurring main booking, copy Bin Cleaning details only when the customer explicitly selected Bin Cleaning frequency **Recurring**. If Bin Cleaning frequency is **One-off**, omit it from generated visits. Other additional cleaning services apply to the initial request only and are not copied to future visits unless separately agreed.

A Bin Cleaning “Recurring” selection does not, by itself, create a new independent Bin-only schedule when the main booking is One-off. It records the requested frequency for BrightNest to review; creating a separate schedule would be additional scheduling behavior outside this feature.

## Tech Stack

- Frontend: React 19, TypeScript 5.6, Vite, Tailwind CSS; booking form in `client/src/pages/Home.tsx`.
- Frontend API contract: `client/src/lib/api.ts`.
- Backend: FastAPI, Pydantic 2, SQLAlchemy 2, PostgreSQL; request/read models in `backend/app/schemas.py`, persistence in `backend/app/models.py`, booking creation and recurring generation in `backend/app/routers/bookings.py`.
- Database revisions use Alembic in `backend/migrations/versions/`.
- Staff UI and internal notification email: `client/src/pages/Admin.tsx` and `backend/app/notifications.py`.

## Project Structure and Expected Files

| Area | Expected file(s) | Purpose |
|---|---|---|
| Customer form | `client/src/pages/Home.tsx` | Multi-select, conditional fields, optionality/defaults, preserve three steps and quote-only display. |
| API types | `client/src/lib/api.ts` | Typed structured request and booking response. |
| Admin display | `client/src/pages/Admin.tsx` | Show selected services/details to authorised staff. |
| API validation | `backend/app/schemas.py` | Typed service details and server-side validation. |
| Persistence | `backend/app/models.py` | Nullable JSON field; preserve legacy boolean and all existing values. |
| Booking workflows | `backend/app/routers/bookings.py` | Save details, expose them to Admin, and apply the recurring rule. |
| Internal email | `backend/app/notifications.py` | Include all selected services and supplied details in new-booking notification. |
| Migration | `backend/migrations/versions/<new_revision>_booking_additional_services.py` | Add only the nullable JSON column; do not rewrite existing rows. |
| Regression tests | `backend/tests/test_foundation.py`, `backend/tests/test_notifications.py`, and frontend tests in the existing test structure | Validate form states, payload, persistence, compatibility, recurrence, and staff visibility. |

No package, pricing, branding, route, or unrelated feature change is in scope. No production database migration or deployment is performed as part of specification or implementation approval.

## Code Style

Use explicit TypeScript service labels and service-specific detail types rather than untyped form data. For example:

```ts
type BinCleaningDetails = {
  number_of_bins: number;
  bins: Array<{ type_or_colour?: string }>;
  collection_day?: string;
  frequency: "One-off" | "Recurring";
  notes?: string;
};

type AdditionalServicesRequest = {
  bin_cleaning: BinCleaningDetails | null;
  items: AdditionalCleaningItem[];
};
```

Keep form state scoped to the booking form, render each field group only for an active choice, and submit only the primary Bin details and active additional-service details. Mirror input constraints with Pydantic validation; frontend checks are not the trust boundary.

## Commands

- Frontend type check: `pnpm check`
- Frontend production build: `pnpm build`
- Frontend local development: `pnpm dev`
- Backend tests: `cd backend && pytest -q`
- Migration chain check: `cd backend && alembic heads`
- Migration upgrade test: `cd backend && alembic upgrade head` against an isolated test database only. Do not upgrade the production database without separate explicit approval.

## Testing Strategy

1. **Frontend/build:** Run TypeScript check and production build. Confirm the three steps and all current main booking/contact/date/time fields remain. In a local preview, test all 11 choices, selecting/deselecting, combinations of Bin Cleaning with another main service, and multiple additional services.
2. **Conditional fields/optionality:** Confirm no add-on detail field is shown until its service is selected, except Bin details for primary Bin Cleaning. Verify deselection clears that service’s values from the payload. Verify optional fields can remain blank, defaults are provided as specified, and only “Other” requires a description when selected.
3. **Bin cases:** Test primary Bin Cleaning and Bin Cleaning as an add-on. Verify no duplicate option/checkbox; count changes create one type/colour input per bin; collection day and notes may be blank; frequency defaults to One-off and can be set to Recurring.
4. **Other service cases:** Test single and double oven; window quantity and inside/outside/both; carpet room/item counts; sofa/upholstery type and seats; optional kitchen requirements; fridge/freezer type/quantity; mattress quantity/size; washing-machine quantity/type; and Other description. Combine several selections and confirm only relevant fields show for each.
5. **Pricing regression:** For every main service, verify **“Quote required”** and its explanation remain; no calculated total or add-on price appears; published starting rates are unchanged.
6. **API/persistence:** Submit representative local/test requests for primary Bin, Bin add-on, multiple services, optional blanks, and Other. Inspect request and stored record to verify every selection and supplied detail is saved, optional blanks remain valid, deselected details are absent, legacy `bin_cleaning` is consistent, and final notes remain independent. Do not submit a real customer booking.
7. **Staff visibility:** Verify the protected Admin booking detail and internal notification email both show the selected services and their associated details; test that free-text HTML is escaped.
8. **Recurring behavior:** Verify Bin is copied to future generated visits only when the main booking recurs and Bin frequency is Recurring; one-off Bin and all other additional services are not copied. A one-off main booking does not create a separate schedule.
9. **Migration/compatibility:** Against an isolated test database, create a legacy booking, apply the migration, and prove all existing rows, IDs, notes, service selections, `bin_cleaning` flags, and financial values remain unchanged. Verify legacy rows with null new data still load and display with empty structured details.

## Boundaries

- **Always:** Preserve the three-step flow, main booking fields, existing final optional notes, rates/prices, disabled-calculator state, “Quote required” display, and branding. Validate supplied structured data server-side and safely escape email text. Touch only the listed booking-form/API/persistence/Admin/email/test files plus the necessary additive migration.
- **Ask first:** Apply the migration to the live database, merge/push/deploy the feature, or change recurring behavior, customer communications, or scope beyond this specification.
- **Never:** Re-enable automatic price calculation, add or change prices, remove the primary Bin Cleaning service, add a duplicate Bin Cleaning control, or change unrelated website features.

## Success Criteria

- Step 1 has one optional Additional Cleaning Services multi-select with all 11 requested choices and supports multiple simultaneous selections.
- Bin Cleaning remains a main service. Its add-on choice is hidden when it is the primary service, but bin details are still available in the unified section; as an add-on to another main service, it is selectable there.
- Bin fields include bin count, a separate colour/type entry for each bin, optional collection day, and its own One-off/Recurring frequency.
- Each selected service displays only relevant fields: single/double oven; window quantity and inside/outside/both; carpet/rug room/item counts; sofa type/seats; optional kitchen requirements; relevant quantities/details for fridge/freezer, mattress, and washing machine; and an Other description.
- Optional fields can remain blank where specified; “Other” description is required only when “Other” is selected. Only active selections and their entered/default values are submitted and saved with the booking enquiry.
- Structured values pass server validation and appear in the protected Admin booking detail and internal new-booking email.
- Migration adds only a nullable JSON column and tests prove every existing booking and its previous values remain intact/readable.
- The old separate “Add bin cleaning” checkbox is gone; no duplicate Bin Cleaning control appears.
- Existing booking flow and submission remain functional. No calculated total or additional-service charge appears; calculator remains disabled, “Quote required” remains, and all starting rates are unchanged.
- The booking remains three steps and retains all current fields. At 390×844, the optional checkbox section is compact, has no horizontal overflow, and displays detail fields only for selected services; no service is preselected and skipping add-ons does not block submission.
- Approved recurring behavior is respected; other add-on services remain one-off.
- Frontend checks/build, backend tests, migration tests, and booking combinations pass.

## Approved Decisions and Current Status

The user approved the recurrence boundary: Bin Cleaning marked **Recurring** is attached to future visits only when the main booking itself is recurring; it does not create a separate schedule if the main booking is One-off. On 2026-10-11 the user additionally approved the compact/mobile form constraints above and requested fresh tests/build without live deployment.

**Status:** The additional-services feature and approved mobile refinement are implemented and verified on `feat/additional-cleaning-services-20261011`. No production database migration, merge, or deployment has occurred; the live website and database remain unchanged. Separate user approval is still required before merge or deployment.
