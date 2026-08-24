
## Live calendar verification — 2026-08-24

URL checked: https://brightnestcleaning.vercel.app/?verify=253f44a

The Ready production deployment marked `253f44a` serves the updated booking date picker. After opening the date picker, the live browser exposes August 2026 dates 24 through 31, followed by September 1 through 5; earlier rows include the rest of the month. The calendar is rendering the full month grid, not only the first 14 cells. The user screenshot showing only two rows was from an earlier/stale visual state.

## Production verification — Ready deployment 253f44a

The exact URL `https://brightnestcleaning.vercel.app/?deployment=253f44a` was opened and the booking date picker was clicked. The live browser exposes August 2026 dates 24–31 and September 1–5, with earlier August rows also present, confirming the full month grid is rendered in production. The Vercel dashboard screenshot shows the same `253f44a` deployment as Ready, Production, and `main`.

## Local preview full-grid verification — 2026-08-24

After replacing the 80vh cap with `max-height: calc(100dvh - 1rem)`, the local preview date picker shows the complete six-row month grid. The visible grid includes August 26–31, August 1–8, 9–15, 16–22, 23–29, and August 30–31 followed by September filler dates. All dates through the end of the month are reachable in the drawer.

## Live calendar QA — 2026-08-24

Production URL checked: `https://brightnestcleaning.vercel.app/?qa=0069bfa`.

The live date picker opened successfully. The August 2026 grid displayed all rows through August 31. The next-month control changed the view to September 2026 and exposed September dates through September 30. Selecting September 1 closed the picker and updated the booking field to `Tue 1 September`.

## Two-column date-picker verification — 2026-08-24

The local preview at laptop width was opened with the date drawer active after the explicit grid-row fix. The drawer handle is at the top, the sticky `Choose preferred date` header is directly below it, quick choices and visit rhythm occupy the left column, and the calendar occupies the right column. The full six-row August grid is visible through August 31 within the drawer. The desktop rule is gated at 768px, preserving the mobile stacked layout.

## Compact calendar verification — 2026-08-24

After removing the desktop two-column rules and setting `showOutsideDays={false}` with `fixedWeeks={false}`, the local date-picker preview is compact and centered. August shows only current-month dates through August 31; the preview no longer displays prior-month filler numbers. Next-month navigation to September shows only September 1–30, with no October filler numbers. The controls remain above the calendar in a single-column flow.

## 100% zoom compact-layout verification — 2026-08-24

After compact spacing changes, the desktop local preview keeps the booking controls in a single-column flow and removes the oversized two-panel composition. The date-picker drawer remains viewport-aware, with reduced header/control spacing and smaller calendar dimensions intended to prevent the outer scrollbar at normal zoom.

## 100% zoom verification after compact sizing — 2026-08-24

The refreshed local preview now uses a compact single-column drawer. The calendar is centered beneath the controls, shows only the selected month’s current dates, and the DOM exposes August date buttons through August 31. The desktop rules reduce the calendar card to 17.5rem, reduce day buttons to 1.5rem, tighten week gaps, and hide drawer overflow at widths >=768px.
