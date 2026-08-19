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
    title: "6. Payment arrangements",
    body: "Payment method, invoice details, and any deposit requirements will be confirmed with you before a booking is finalised. We will not take payment through this website unless a secure payment service is clearly provided and agreed.",
  },
  {
    title: "7. Website content and acceptable use",
    body: "The website, BrightNest name, visual identity, and original content are provided for personal, non-commercial use in connection with our services. You must not misuse the booking form, attempt to interfere with the website, or use content from the site in a way that suggests BrightNest has endorsed or partnered with you without written permission.",
  },
  {
    title: "8. Liability and your legal rights",
    body: "Nothing in these terms excludes or limits liability where it would be unlawful to do so. Subject to applicable law and any service-specific written agreement, BrightNest’s responsibility relates to the services we have expressly agreed to provide. These terms do not affect any statutory consumer rights that you may have.",
  },
  {
    title: "9. Contact and updates",
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
              {terms.slice(0, 4).map((term) => <article key={term.title} className="rounded-[22px] border border-[#173137]/10 bg-white p-6 sm:p-8"><h2 className="font-display text-[30px] tracking-[-0.045em]">{term.title}</h2><p className="mt-4 text-sm leading-7 text-[#173137]/72 sm:text-base">{term.body}</p></article>)}
              <article className="overflow-hidden rounded-[22px] border border-[#2f9f91]/30 bg-white">
                <div className="bg-[#d9f0e8] p-6 sm:p-8"><p className="eyebrow">Clear and considered</p><h2 className="font-display mt-3 text-[34px] tracking-[-0.05em]">5. Cancellation and refund policy</h2><p className="mt-4 max-w-[700px] text-sm leading-7 text-[#173137]/75 sm:text-base">We understand that plans change. Please contact BrightNest as early as possible if you need to move or cancel a confirmed booking. Any amount retained or charged for a late cancellation will be limited to a reasonable amount reflecting our direct loss, after taking reasonable steps to rebook the time.</p></div>
                <div className="grid gap-3 p-6 sm:grid-cols-2 sm:p-8">
                  <div className="rounded-[16px] border border-[#173137]/10 bg-[#f8f6ef] p-5"><p className="text-[10px] font-extrabold uppercase tracking-[0.13em] text-[#2f9f91]">48+ hours’ notice</p><p className="mt-3 text-sm font-bold leading-6 text-[#173137]/78">Change or cancel without a BrightNest cancellation charge. If you have paid in advance, we will refund the relevant unused amount or apply it to an agreed rescheduled visit.</p></div>
                  <div className="rounded-[16px] border border-[#173137]/10 bg-[#f8f6ef] p-5"><p className="text-[10px] font-extrabold uppercase tracking-[0.13em] text-[#2f9f91]">24–48 hours’ notice</p><p className="mt-3 text-sm font-bold leading-6 text-[#173137]/78">We will try to reschedule your visit at no extra charge, subject to availability. If cancellation is necessary, we will discuss any reasonable direct loss with you before applying a charge.</p></div>
                  <div className="rounded-[16px] border border-[#173137]/10 bg-[#f8f6ef] p-5"><p className="text-[10px] font-extrabold uppercase tracking-[0.13em] text-[#2f9f91]">Less than 24 hours</p><p className="mt-3 text-sm font-bold leading-6 text-[#173137]/78">A reasonable late-cancellation charge may apply where the allocated time cannot be rebooked. We will not treat this as a penalty or retain more than is reasonable for the direct loss.</p></div>
                  <div className="rounded-[16px] border border-[#173137]/10 bg-[#f8f6ef] p-5"><p className="text-[10px] font-extrabold uppercase tracking-[0.13em] text-[#2f9f91]">No access or no-show</p><p className="mt-3 text-sm font-bold leading-6 text-[#173137]/78">If we cannot safely access the property at the agreed time, the same short-notice approach may apply. Please contact us promptly if an access issue arises.</p></div>
                </div>
                <div className="border-t border-[#173137]/10 p-6 sm:p-8"><h3 className="font-display text-[28px] tracking-[-0.045em]">If you are unhappy with a service</h3><p className="mt-3 text-sm leading-7 text-[#173137]/72 sm:text-base">Please contact us as soon as reasonably possible, ideally within 48 hours, with any relevant details. We will review the concern and, where appropriate, offer to repeat the affected service within a reasonable time. If repeat performance is not possible, would take too long, or would cause significant inconvenience, we will discuss an appropriate price reduction or refund. Your statutory consumer rights are not affected.</p><h3 className="font-display mt-7 text-[28px] tracking-[-0.045em]">Online and distance bookings</h3><p className="mt-3 text-sm leading-7 text-[#173137]/72 sm:text-base">Where a statutory cooling-off right applies to a service arranged online, by phone, or away from our premises, you may have 14 days to cancel. If you ask us to begin services during that period, we may charge a proportionate amount for the work supplied up to cancellation. For general guidance, see the <a className="font-bold text-[#2f9f91] underline decoration-[#2f9f91]/40 underline-offset-4" href="https://www.gov.uk/government/publications/cancelling-goods-or-services-guide-for-consumers/cancelling-goods-or-services" target="_blank" rel="noreferrer">GOV.UK consumer cancellation guide</a>.</p></div>
              </article>
              {terms.slice(4).map((term) => <article key={term.title} className="rounded-[22px] border border-[#173137]/10 bg-white p-6 sm:p-8"><h2 className="font-display text-[30px] tracking-[-0.045em]">{term.title}</h2><p className="mt-4 text-sm leading-7 text-[#173137]/72 sm:text-base">{term.body}</p></article>)}
              <article className="rounded-[22px] bg-[#f1c9ad] p-6 sm:p-8"><p className="eyebrow">Related policy</p><p className="font-display mt-3 text-[28px] tracking-[-0.045em]">Want to know how booking details are handled?</p><Link href="/privacy-policy" className="mt-5 inline-flex items-center gap-2 text-sm font-extrabold text-[#173137] underline decoration-[#173137]/35 underline-offset-4">Read the Privacy Policy <ArrowLeft className="h-4 w-4 rotate-180" /></Link></article>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
