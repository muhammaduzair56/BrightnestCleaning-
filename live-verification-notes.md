
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

## 100% route QA — homepage

At the desktop preview viewport, the homepage document clientWidth and scrollWidth both measured 1265px, so there is no horizontal document overflow. One decorative testimonial glow extends slightly beyond the viewport but does not expand document width because it is visually contained by its section.

## 100% route QA — blog index

The blog index measured clientWidth 1265px and scrollWidth 1265px at desktop preview size. No horizontal overflow or off-screen wide elements were detected. The two-panel editorial hero and article grid fit within the viewport width.

## 100% route QA — representative blog article

The deep-cleaning article measured clientWidth 1265px and scrollWidth 1265px at desktop preview size. No horizontal overflow or off-screen wide elements were detected. The editorial split hero, long-form copy, and share controls fit within the page width.

## 100% route QA — Privacy Policy

The Privacy Policy route measured clientWidth 1265px and scrollWidth 1265px at desktop preview size. No horizontal overflow or off-screen wide elements were detected. Its two-column introduction and legal content cards fit within the viewport width.

## 100% route QA — Terms of Service

The Terms of Service route measured clientWidth 1265px and scrollWidth 1265px at desktop preview size. No horizontal overflow or off-screen wide elements were detected. The cancellation/refund policy content remains within the page layout.

## 100% route QA — customer dashboard

The customer dashboard empty/auth state measured clientWidth 1280px and scrollWidth 1280px at desktop preview size. No horizontal overflow or off-screen wide elements were detected.

## 100% route QA — admin

The admin unauthenticated/API-configuration state measured clientWidth 1280px and scrollWidth 1280px at desktop preview size. No horizontal overflow or off-screen wide elements were detected.

## 100% route QA summary

Home, Blog, representative Blog article, Privacy Policy, Terms of Service, customer Dashboard, and Admin routes were checked at desktop preview dimensions representing normal 100% zoom. No route produced horizontal document overflow or off-screen wide elements. The dashboard and admin routes correctly showed their current unauthenticated/API-configuration states without layout overflow.

## Mobile visual QA — homepage and blog index

At 375px width, the homepage renders as a single-column flow with readable hero text, stacked booking controls, compact service cards, and a full-width footer. The blog index keeps the header, hero, article cards, CTA, and footer within the phone viewport; no visible horizontal bleed appears in either screenshot. Some long-page image blocks are intentionally lazy-loaded/blank until scrolled into view in the captured full-page render, which is expected for lazy media.

## Mobile visual QA — article and Terms

At 375px width, the article route keeps its editorial hero, image, long-form text, CTA, share buttons, and footer inside the viewport without horizontal overflow. The Terms route stacks policy sections into readable single-column cards; headings and cancellation/refund content remain within the phone width with no visible clipping.

## Mobile visual QA — Privacy Policy and customer dashboard

The Privacy Policy route remains a clean single-column mobile reading experience with wrapped links and no visible side overflow. The customer dashboard auth/empty state uses a centered card with readable text and a touch-friendly return button; its card stays inside the 375px viewport.

## Mobile visual QA — admin

The admin API-configuration state stays inside the 375px viewport. The heading wraps naturally, the explanatory text remains readable, and the return button is comfortably tappable; no visible side overflow appears.

## Mobile QA summary

At 375px width, Home, Blog, representative article, Privacy Policy, Terms of Service, Dashboard, and Admin all remain within the phone viewport. Navigation, hero blocks, article cards, legal sections, buttons, and auth/configuration states stack correctly. No visual horizontal overflow was observed in the captured full-page routes.
