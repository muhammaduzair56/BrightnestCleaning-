/**
 * BrightNest design reminder — Quiet British Home Editorial: plain-language terms presented
 * with generous measure, calm ink/mint material contrast, and no intimidating legal clutter.
 */
import { ArrowLeft, ClipboardCheck, Mail, ShieldCheck } from "lucide-react";
import { Link } from "wouter";

const terms = [
  {
    title: "1. About these terms",
    body: "These Terms of Service explain how BrightNest Cleaning UK handles website enquiries and cleaning-service requests. They apply when you browse this website, submit a booking request, or arrange services with us. A separate written confirmation may set out service-specific details that apply to your confirmed visit.",
  },
  {
    title: "2. Booking requests and confirmation",
    body: "Submitting the website form creates a request for BrightNest to review. It does not by itself confirm an appointment, price, cleaner, or service scope. We will contact you to confirm availability, the requested work, any additional requirements, and the next steps before a booking is treated as confirmed.",
  },
  {
    title: "3. Quotes, scope and changes",
    body: "Starting prices shown on the website are guidance only where stated. Final pricing for specialist work, larger properties, or jobs requiring extra time or materials may depend on the information you provide and any agreed scope. Please tell us promptly if your requirements change so we can review the service plan and quote.",
  },
  {
    title: "4. Access, accuracy and safe working conditions",
    body: "You are responsible for providing accurate booking details, reasonable access at the agreed time, and a safe environment for cleaning work. Please let us know in advance about access instructions, pets, fragile items, hazards, or any relevant practical information. BrightNest may pause or reschedule work where safe access or safe working conditions are not available.",
  },
  {
    title: "5. Changes, cancellation and payment",
    body: "If you need to change or cancel a request, contact BrightNest as soon as possible. Any service-specific cancellation timing, payment method, invoice details, or deposit requirements will be confirmed with you before a booking is finalised. We will not take payment through this website unless a secure payment service is clearly provided and agreed.",
  },
  {
    title: "6. Website content and acceptable use",
    body: "The website, BrightNest name, visual identity, and original content are provided for personal, non-commercial use in connection with our services. You must not misuse the booking form, attempt to interfere with the website, or use content from the site in a way that suggests BrightNest has endorsed or partnered with you without written permission.",
  },
  {
    title: "7. Liability and your legal rights",
    body: "Nothing in these terms excludes or limits liability where it would be unlawful to do so. Subject to applicable law and any service-specific written agreement, BrightNest’s responsibility relates to the services we have expressly agreed to provide. These terms do not affect any statutory consumer rights that you may have.",
  },
  {
    title: "8. Contact and updates",
    body: "Questions about these terms, a booking request, or a confirmed service can be sent to brightnestcleaninguk@gmail.com. We may update these terms as our services or booking process develop. The latest version will be published on this page.",
  },
];

export default function TermsOfService() {
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
            <div className="rounded-[28px] bg-[#d9f0e8] p-7 sm:p-9">
              <p className="eyebrow">Clear from the start</p>
              <ClipboardCheck className="mt-12 h-12 w-12 text-[#2f9f91]" />
              <p className="mt-5 max-w-[280px] text-sm leading-6 text-[#173137]/70">A straightforward outline of how BrightNest handles website requests and confirmed services.</p>
            </div>
            <div>
              <p className="eyebrow">Terms of Service</p>
              <h1 className="font-display mt-5 text-[52px] leading-[0.94] tracking-[-0.065em] sm:text-[76px]">Good service begins with clear expectations.</h1>
              <p className="mt-7 max-w-[620px] text-base leading-7 text-[#173137]/70">Please read these terms before submitting a request or arranging cleaning services with BrightNest Cleaning UK.</p>
              <p className="mt-6 text-xs font-extrabold uppercase tracking-[0.14em] text-[#2f9f91]">Last updated: 20 August 2026</p>
            </div>
          </div>

          <div className="mt-16 grid gap-12 lg:grid-cols-[0.58fr_1.42fr]">
            <aside className="h-fit rounded-[24px] border border-[#173137]/10 bg-[#173137] p-6 text-[#f8f6ef] lg:sticky lg:top-8">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#9ee0d2]">At a glance</p>
              <p className="mt-4 text-sm font-bold leading-6 text-white/75">A website booking form creates a request. Availability, scope, quote, and final appointment are confirmed directly with BrightNest.</p>
              <a href="mailto:brightnestcleaninguk@gmail.com" className="mt-6 inline-flex items-center gap-2 text-sm font-extrabold text-[#9ee0d2] underline decoration-[#9ee0d2]/35 underline-offset-4"><Mail className="h-4 w-4" /> Ask a question</a>
            </aside>
            <div className="space-y-4">
              {terms.map((term) => <article key={term.title} className="rounded-[22px] border border-[#173137]/10 bg-white p-6 sm:p-8"><h2 className="font-display text-[30px] tracking-[-0.045em]">{term.title}</h2><p className="mt-4 text-sm leading-7 text-[#173137]/72 sm:text-base">{term.body}</p></article>)}
              <article className="rounded-[22px] bg-[#f1c9ad] p-6 sm:p-8"><p className="eyebrow">Related policy</p><p className="font-display mt-3 text-[28px] tracking-[-0.045em]">Want to know how booking details are handled?</p><Link href="/privacy-policy" className="mt-5 inline-flex items-center gap-2 text-sm font-extrabold text-[#173137] underline decoration-[#173137]/35 underline-offset-4">Read the Privacy Policy <ArrowLeft className="h-4 w-4 rotate-180" /></Link></article>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
