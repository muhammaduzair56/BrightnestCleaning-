# Vellora Cleaning — Website Rebrand Notes

- **Master wordmark:** `public/vellora-cleaning-logo.webp` — user-provided WebP, 680 × 226 px, transparent background, 28,790 bytes. Preserve its approximately 3:1 aspect ratio; do not stretch or crop it.
- **Logo placements:** Home, Services, Blog, Dashboard, Admin, Privacy Policy, Terms of Service and 404 screens use the local master wordmark. Favicon/Apple touch/PWA icons use transparent square variants with the complete logo proportionally fitted.
- **Brand copy:** Customer-visible website wording, booking/consent messages, customer emails, receipts, API customer messages, service/blog content and public discovery copy use Vellora or Vellora Cleaning.
- **Contact email:** Public Privacy Policy/Terms mail links and the documented admin-notification recipient now use `hello.velloraclean@gmail.com`. SMTP/Resend sender identity and hosted Render settings are deployment-managed and were not changed here; use only an address verified by the mail provider as the sender.
- **Domain:** `https://velloracleaning.vercel.app` remains the active canonical host. The prior host is a legacy redirect and is not treated as the displayed brand.
- **Preserved identifiers:** Deployment/repository names, backend health-service key, login session-storage keys, existing database records, old blog-asset URLs and API/storage identifiers remain unchanged for delivery, compatibility or record-preservation.
- **Legal review:** Visible Privacy Policy and Terms brand wording now says Vellora Cleaning. No underlying policy/cancellation rules were intentionally changed. The owner should review the legal entity/trading-name and contact details before broad publication.
- **SEO rendering limitation:** Route-specific metadata is applied after the React SPA loads; raw initial HTML contains shared Vellora defaults. Server/static-rendered route content and a true HTTP 404 for unknown routes remain separate technical work.
- **Social image:** The master wordmark is 680 × 226 (3:1). Platforms may letterbox or crop it in large social-card layouts; a dedicated Vellora 1200 × 630 share card could improve preview presentation later.
