/**
 * BrightNest design reminder — Quiet British Home Editorial: an honest, legible legal page
 * using warm ivory, ink, mint accents and wide reading measure rather than dense legal chrome.
 */
import { ArrowLeft, ChevronRight, Mail, ShieldCheck } from "lucide-react";
import { Link } from "wouter";

const policySections = [
  {
    title: "1. Who we are and how to contact us",
    body: "BrightNest Cleaning UK provides domestic and specialist cleaning services. For questions about this notice or how we handle your personal information, contact us at brightnestcleaninguk@gmail.com.",
  },
  {
    title: "2. The information we collect",
    body: "When you submit a booking request, we collect the details needed to understand and respond to it. This can include your name, email address, phone number, postcode, requested service, preferred date and time, and any notes you choose to provide. We also record the time that you accept this Privacy Policy.",
  },
  {
    title: "3. How we use your information",
    body: "We use booking details to review your request, contact you about service availability, prepare a quote where required, arrange a service, and keep an internal record of our communication. We do not use your booking details for unrelated marketing without a separate, clear permission from you.",
  },
  {
    title: "4. Our lawful basis",
    body: "We process booking information because it is necessary to take steps at your request before entering into a service arrangement, and because BrightNest has legitimate interests in responding to enquiries, delivering services, and keeping appropriate business records. Where we rely on consent, you can withdraw it by contacting us.",
  },
  {
    title: "5. Sharing, storage and retention",
    body: "We use service providers that support our website, secure booking system, business email, database hosting, and operational administration. They may process information only to provide those services to us. We keep booking records only for as long as reasonably needed to respond to your request, provide services, resolve queries, and meet applicable record-keeping obligations, after which records are securely deleted or anonymised.",
  },
  {
    title: "6. Your choices and rights",
    body: "Depending on applicable law, you may ask to access, correct, erase, restrict, or object to our use of your personal information. You may also ask for a copy of information you have provided to us. To make a request, email brightnestcleaninguk@gmail.com. If you are unhappy with our response, you may raise a concern with the UK Information Commissioner’s Office.",
  },
  {
    title: "7. Updates to this notice",
    body: "We may update this Privacy Policy when our services, systems, or legal obligations change. The latest version will always be published on this page with its updated date.",
  },
];

export default function PrivacyPolicy() {
  return (
    <main className="min-h-screen bg-[#f8f6ef] text-[#173137]">
      <header className="border-b border-[#173137]/10 bg-[#f8f6ef]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1220px] items-center justify-between px-5 py-5 lg:px-10">
          <Link href="/" className="group inline-flex items-center gap-3 font-display text-[28px] tracking-[-0.06em]"><span className="grid h-11 w-11 place-items-center rounded-[16px] bg-[#d9f0e8] text-[#2f9f91]"><ShieldCheck className="h-5 w-5" /></span> BrightNest</Link>
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-extrabold text-[#173137]/72 transition-colors hover:text-[#2f9f91]"><ArrowLeft className="h-4 w-4" /> Back to website</Link>
        </div>
      </header>

      <section className="px-5 pb-16 pt-16 lg:px-10 lg:pb-24 lg:pt-24">
        <div className="mx-auto max-w-[1020px]">
          <div className="grid gap-12 lg:grid-cols-[0.72fr_1.28fr] lg:items-end">
            <div className="rounded-[28px] bg-[#173137] p-7 text-[#f8f6ef] sm:p-9">
              <p className="eyebrow text-[#9ee0d2]">Your information, handled with care</p>
              <ShieldCheck className="mt-12 h-12 w-12 text-[#9ee0d2]" />
              <p className="mt-5 max-w-[280px] text-sm leading-6 text-white/65">Clear information about the booking details you share with BrightNest.</p>
            </div>
            <div>
              <p className="eyebrow">Privacy Policy</p>
              <h1 className="font-display mt-5 text-[52px] leading-[0.94] tracking-[-0.065em] sm:text-[76px]">Straightforward privacy, written for real people.</h1>
              <p className="mt-7 max-w-[620px] text-base leading-7 text-[#173137]/70">This notice explains what BrightNest Cleaning UK does with personal information submitted through our website and booking form.</p>
              <p className="mt-6 text-xs font-extrabold uppercase tracking-[0.14em] text-[#2f9f91]">Last updated: 20 August 2026</p>
            </div>
          </div>

          <div className="mt-16 grid gap-12 lg:grid-cols-[0.58fr_1.42fr]">
            <aside className="h-fit rounded-[24px] border border-[#173137]/10 bg-[#e7ede7] p-6 lg:sticky lg:top-8">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#173137]/55">Quick summary</p>
              <p className="mt-4 text-sm font-bold leading-6 text-[#173137]/78">We only ask for the details needed to respond to and manage your cleaning request. We do not sell your personal information.</p>
              <a href="mailto:brightnestcleaninguk@gmail.com" className="mt-6 inline-flex items-center gap-2 text-sm font-extrabold text-[#2f9f91] underline decoration-[#2f9f91]/40 underline-offset-4"><Mail className="h-4 w-4" /> Email BrightNest</a>
            </aside>
            <div className="space-y-4">
              {policySections.map((section) => <article key={section.title} className="rounded-[22px] border border-[#173137]/10 bg-white p-6 sm:p-8"><h2 className="font-display text-[30px] tracking-[-0.045em]">{section.title}</h2><p className="mt-4 text-sm leading-7 text-[#173137]/72 sm:text-base">{section.body}</p></article>)}
              <article className="rounded-[22px] bg-[#d9f0e8] p-6 sm:p-8"><p className="eyebrow">Helpful resource</p><p className="font-display mt-3 text-[28px] tracking-[-0.045em]">Want to learn more about privacy rights?</p><a href="https://ico.org.uk/for-organisations/advice-for-small-organisations/privacy-notices-and-cookies/how-to-write-a-privacy-notice-and-what-goes-in-it/" target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 text-sm font-extrabold text-[#173137] underline decoration-[#173137]/35 underline-offset-4">Visit the Information Commissioner’s Office <ChevronRight className="h-4 w-4" /></a></article>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
