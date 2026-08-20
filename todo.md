# BrightNest Pricing & Deployment Update

- [x] Add the supplied hourly and quote-based prices to the service catalogue.
- [x] Expand the booking service choices to cover all listed cleaning categories.
- [x] Verify the revised page on desktop and mobile.
- [x] Run the production build and save the updated release checkpoint.
- [x] Create a clean source-code ZIP archive for download.
- [x] Push the complete current codebase to github.com/muhammaduzair56/BrightnestCleaning-.
- [x] Create the FastAPI backend structure and secure configuration contract.
- [x] Model the Neon PostgreSQL schema with indexed booking and admin records.
- [x] Implement JWT-admin authentication, booking APIs, and server-side email notifications.
- [x] Add Redis caching, resilient rate limiting, structured error handling, and audit logging.
- [x] Connect the website booking form and build the protected admin bookings interface.
- [x] Test the complete flow and add Hugging Face Spaces deployment files.
- [x] Add clear loading and success feedback to the public booking submission flow.
- [x] Add live email and phone validation with accessible field-level guidance.
- [x] Add a required privacy-policy consent checkbox before booking submission.
- [x] Synchronize the preview with the shared project’s latest version.
- [x] Verify current frontend-to-backend integration readiness locally.
- [x] Export the complete current project as a ZIP archive.
- [x] Push the synchronized project to the configured GitHub repository.
- [x] Create a BrightNest-branded version of the supplied authentic feedback asset.
- [x] Add the verified customer feedback to a homepage testimonial section.
- [x] Create a dedicated Privacy Policy route and page.
- [x] Link the mandatory booking consent text to the Privacy Policy page.
- [x] Create a dedicated Terms of Service route and page.
- [x] Add Terms of Service beside Privacy Policy in the website footer.
- [x] Research and draft the cancellation and refund policy section.
- [x] Validate frontend, backend, and migration behaviour after the policy update.
- [x] Push the completed policy update to GitHub and refresh the complete ZIP archive.
- [x] Add an accessible homepage FAQ section covering booking and cancellations.
- [x] Verify the latest frontend-to-backend integration contract and tests.
- [x] Push the FAQ-enhanced project to GitHub and refresh the complete ZIP archive.
- [x] Audit frontend, backend, deployment configuration, and Git history.
- [x] Verify test outcomes, backend health, and secret-exposure safeguards.
- [x] Prepare and deliver the detailed BrightNest technical report.
- [x] Implement route-level lazy loading to split non-home JavaScript.
- [x] Measure the production bundle and push the optimization to GitHub.
- [x] Run Lighthouse against the optimized homepage and summarize Core Web Vitals findings.
- [x] Produce a production optimization guide targeting a homepage transfer weight below 2 MB.
- [x] Add branded Open Graph image, title, and description metadata for social sharing.
- [x] Verify the deployed social metadata and push the update to GitHub.
- [x] Capture and fix the deployed frontend runtime error causing the blank page.
- [x] Publish and verify the repaired Vercel frontend.
- [x] Replace deployed image paths that return 404 on Vercel.
- [x] Remove horizontal overflow in the mobile layout and verify the corrected deployment.
- [x] Create a refreshed downloadable ZIP archive of the latest source code.
- [x] Diagnose and fix the Open Graph preview image on the live website.
- [x] Create and deliver a refreshed source-code ZIP after the Open Graph update.
- [x] Create a new social-preview image and update metadata for brightnestcleaning.vercel.app.
- [x] Fix service-card numbering after 10 and eliminate mobile text overlaps.
- [x] Verify the new domain deployment and deliver a refreshed source ZIP.
- [x] Reduce mobile service-card height while keeping all card text readable.
- [ ] Select a free hosting path for the FastAPI backend instead of Hugging Face Docker Spaces.
- [x] Verify Koyeb readiness and document exact deployment settings and environment variables.
- [ ] Guide Koyeb setup away from the example repository to the BrightNest backend repository path.
- [ ] Resolve the missing Koyeb repository option or switch to a free hosting fallback.
- [ ] Deploy the FastAPI backend through the Render Free web-service setup instead of Koyeb.
- [ ] Evaluate Railway as the preferred deployment path for the FastAPI backend.
- [x] Add and verify Railway deployment configuration for the FastAPI backend.
- [x] Review and enhance booking-form loading and successful-submission feedback.
- [x] Replace the native mobile service dropdown with a branded accessible service picker.
- [x] Replace the native Visit rhythm dropdown with a matching branded picker.
- [x] Replace the native date and time controls with branded custom booking pickers.
- [x] Audit and reduce excessive mobile spacing across the homepage.

## Mobile spacing findings

- The main mobile excess came from desktop-scale section padding, repeated 460–500px media blocks, and service-card minimum heights.
- Mobile-only spacing now uses tighter 64px section rhythm, shorter media blocks, reduced editorial grid gaps, denser service cards, and a more compact booking, FAQ, CTA, and footer flow while preserving readable controls.

## Current date and time picker validation

- The booking flow now presents branded Preferred date and Preferred time triggers instead of browser-native date and time controls.
- The Preferred date trigger opens the BrightNest calendar drawer for future-date selection.
- Selecting a future calendar date closes the drawer and updates the trigger with a readable date label.
- The Preferred time drawer presents clear 8:00 am–5:00 pm daytime slots with concise time-of-day guidance.
- Selecting a time slot closes the drawer and updates the trigger with the chosen time and timing context.

## Current booking-picker validation

- The live local booking form now exposes a single branded service-picker trigger with clear rate guidance; the old native service `<select>` is no longer present.
- The revised booking layout remains contained at the booking section with the custom trigger, visit rhythm, date, time, and continue controls clearly separated.
- The custom drawer opens above the booking page with all 15 service choices, concise price labels, and individual selection indicators, replacing the browser-native option sheet.
- Selecting a service closes the drawer and updates the branded trigger with the chosen service and its starting price.
- The Visit rhythm control now uses the same branded trigger and opens a custom picker instead of the mobile browser’s native choice sheet.
- The custom frequency drawer presents one-off, weekly, fortnightly, and monthly choices; choosing Weekly closes the drawer and updates the trigger with its explanatory text.

## Current repair findings

- `brightnestcleaning.vercel.app` was still publishing canonical and social-preview URLs for the old `brightnest-cleaning-ashy.vercel.app` domain.
- A new BrightNest social card has been created, reviewed, and packaged as a first-party 1200×630 JPEG for the new domain.
- The new domain now serves its own canonical URL and social-card image; its desktop services grid shows distinct 01–09 labels with the service content held below each card header.
- At the 375-pixel mobile breakpoint, all 14 cards stay within the page width; labels 01–14 sit above their content and every content block fits its card.
