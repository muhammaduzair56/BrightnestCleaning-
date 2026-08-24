
## Live calendar verification — 2026-08-24

URL checked: https://brightnestcleaning.vercel.app/?verify=253f44a

The Ready production deployment marked `253f44a` serves the updated booking date picker. After opening the date picker, the live browser exposes August 2026 dates 24 through 31, followed by September 1 through 5; earlier rows include the rest of the month. The calendar is rendering the full month grid, not only the first 14 cells. The user screenshot showing only two rows was from an earlier/stale visual state.

## Production verification — Ready deployment 253f44a

The exact URL `https://brightnestcleaning.vercel.app/?deployment=253f44a` was opened and the booking date picker was clicked. The live browser exposes August 2026 dates 24–31 and September 1–5, with earlier August rows also present, confirming the full month grid is rendered in production. The Vercel dashboard screenshot shows the same `253f44a` deployment as Ready, Production, and `main`.

## Local preview full-grid verification — 2026-08-24

After replacing the 80vh cap with `max-height: calc(100dvh - 1rem)`, the local preview date picker shows the complete six-row month grid. The visible grid includes August 26–31, August 1–8, 9–15, 16–22, 23–29, and August 30–31 followed by September filler dates. All dates through the end of the month are reachable in the drawer.
