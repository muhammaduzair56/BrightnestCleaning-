/**
 * BrightNest design reminder — Quiet British Home Editorial: warm ivory, BrightNest Mint,
 * editorial asymmetry, spacious calm, nestline arcs, and clear low-friction booking.
 */
import {
  ArrowRight,
  CalendarDays,
  Check,
  ChevronDown,
  Clock3,
  Home as HomeIcon,
  LoaderCircle,
  Menu,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { ApiError, bookingApi } from "@/lib/api";
import { Link } from "wouter";

type BookingStep = 1 | 2 | 3;

const services = [
  {
    eyebrow: "Everyday care",
    title: "Regular home cleaning",
    price: "From £25/hr",
    description: "A dependable rhythm for the places you live in most.",
    tone: "mint",
  },
  {
    eyebrow: "Room by room",
    title: "Deep cleaning",
    price: "From £30/hr",
    description: "A thorough reset for overlooked corners, surfaces and details.",
    tone: "ink",
  },
  {
    eyebrow: "Moving made easier",
    title: "End of tenancy",
    price: "From £35/hr",
    description: "A considered clean for a smoother handover and fresh start.",
    tone: "apricot",
  },
  {
    eyebrow: "A fresh start",
    title: "Move-in / move-out",
    price: "From £35/hr",
    description: "A detail-first reset before you settle in or hand over the keys.",
    tone: "linen",
  },
  {
    eyebrow: "After the work",
    title: "Post-renovation",
    price: "From £35/hr",
    description: "Clear the dust and fine detail left behind after improving your home.",
    tone: "mint",
  },
  {
    eyebrow: "Guest-ready",
    title: "Airbnb / short-term rental",
    price: "From £25/hr",
    description: "Reliable resets with the finishing touches your guests notice.",
    tone: "linen",
  },
  {
    eyebrow: "Working spaces",
    title: "Office & commercial",
    price: "From £30/hr",
    description: "A considered clean for busy workspaces, shared areas and daily routines.",
    tone: "ink",
  },
  {
    eyebrow: "Specialist care",
    title: "Window cleaning",
    price: "Quote based",
    description: "A tailored quote for the glass, access and finish your property needs.",
    tone: "mint",
  },
  {
    eyebrow: "Kitchen detail",
    title: "Oven cleaning",
    price: "Quote based",
    description: "A focussed appliance clean for the room that works hardest.",
    tone: "linen",
  },
  {
    eyebrow: "Fabric refresh",
    title: "Carpet cleaning",
    price: "Quote based",
    description: "A room-by-room quote shaped around your carpets and cleaning needs.",
    tone: "mint",
  },
  {
    eyebrow: "Fabric refresh",
    title: "Rug cleaning",
    price: "Quote based",
    description: "A tailored refresh for the rugs that make your rooms feel like home.",
    tone: "linen",
  },
  {
    eyebrow: "Fabric refresh",
    title: "Sofa / upholstery",
    price: "Quote based",
    description: "A care-led quote for sofas, chairs and the fabrics you use every day.",
    tone: "ink",
  },
  {
    eyebrow: "Clear the way",
    title: "Rubbish / waste removal",
    price: "Quote based",
    description: "A job-specific quote to help clear unwanted items with less stress.",
    tone: "mint",
  },
  {
    eyebrow: "Small jobs",
    title: "Small one-off jobs",
    price: "Minimum / job quote",
    description: "A flexible, job-specific plan for the little cleaning tasks that add up.",
    tone: "linen",
  },
];

const faqs = [
  {
    question: "What happens after I submit a booking request?",
    answer:
      "Your request is sent securely to BrightNest with your preferred service, time and home details. It is not a confirmed appointment yet. The team will review availability, clarify the scope where needed, and confirm the next step with you.",
  },
  {
    question: "What can I request through the booking form?",
    answer:
      "You can request regular, deep, moving, post-renovation, Airbnb, office and specialist cleaning. Starting rates are shown for routine services; windows, ovens, carpets, rugs, upholstery, waste removal and one-off jobs receive a quote based on the work required.",
  },
  {
    question: "Can I change or cancel a confirmed visit?",
    answer:
      "Yes. Please contact BrightNest as early as possible. With 48 hours or more notice, you can change or cancel without a BrightNest cancellation charge. Between 24 and 48 hours, BrightNest will first try to find a suitable rescheduled visit.",
    link: { href: "/terms-of-service", label: "Read cancellation and refund policy" },
  },
  {
    question: "What happens if I cancel with less than 24 hours’ notice?",
    answer:
      "BrightNest will consider the circumstances and may apply a reasonable charge only where the allocated time cannot be rebooked. Any amount retained or charged is intended to reflect a direct loss, not act as a penalty.",
    link: { href: "/terms-of-service", label: "See the full cancellation policy" },
  },
  {
    question: "Can I receive a refund?",
    answer:
      "For eligible advance payments, BrightNest will refund the unused amount or apply it to an agreed rescheduled visit. If you ask BrightNest to begin an online or distance-booked service during a statutory cooling-off period, a proportionate amount for work already supplied may be payable.",
    link: { href: "/terms-of-service", label: "Read the refund terms" },
  },
  {
    question: "What if I am unhappy with the service?",
    answer:
      "Please contact BrightNest as soon as reasonably possible, ideally within 48 hours, with any relevant details. BrightNest will review the concern and, where appropriate, offer repeat performance within a reasonable time or discuss an appropriate price reduction or refund.",
    link: { href: "/terms-of-service", label: "See service-concern support" },
  },
  {
    question: "Do you cover my area?",
    answer:
      "BrightNest currently presents services for Birmingham and surrounding areas. Add your postcode in the request form so service coverage can be confirmed.",
  },
  {
    question: "Can I ask for a tailored clean?",
    answer:
      "Yes. Choose the closest service and describe any specialist requirements in the final step. Your request will be designed to accommodate custom scopes later in the booking process.",
  },
  {
    question: "Will I pay online today?",
    answer:
      "No payment is taken with a booking request. First, BrightNest will confirm the service scope and preferred visit with you, then share the next steps clearly.",
  },
];

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function Home() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [step, setStep] = useState<BookingStep>(1);
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState("");
  const [service, setService] = useState("");
  const [frequency, setFrequency] = useState("One-off visit");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [postcode, setPostcode] = useState("");
  const [notes, setNotes] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [privacyTouched, setPrivacyTouched] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingReference, setBookingReference] = useState("");
  const minimumDate = new Date().toISOString().slice(0, 10);
  const emailIsValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const phoneDigits = phone.replace(/\D/g, "");
  const phoneIsValid = /^(?:0\d{9,10}|44\d{9,10})$/.test(phoneDigits);
  const emailError = emailTouched ? (!email.trim() ? "Please enter an email address." : !emailIsValid ? "Enter a valid email address, for example you@example.com." : "") : "";
  const phoneError = phoneTouched ? (!phone.trim() ? "Please enter a phone number." : !phoneIsValid ? "Use a UK number beginning 0 or +44." : "") : "";

  const bookService = (serviceName?: string) => {
    if (serviceName) setService(serviceName);
    scrollToSection("booking");
  };

  const advanceBooking = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");

    if (step === 1 && (!service || !date || !time)) {
      setFormError("Please choose a service, date and preferred time before continuing.");
      return;
    }

    if (step === 2) {
      setEmailTouched(true);
      setPhoneTouched(true);
    }

    if (step === 2 && (!name.trim() || !emailIsValid || !phoneIsValid || !postcode.trim())) {
      setFormError("Please check your contact details before continuing.");
      return;
    }

    if (step === 3 && !privacyConsent) {
      setPrivacyTouched(true);
      setFormError("Please confirm that you consent to the BrightNest privacy policy before sending your request.");
      return;
    }

    if (step < 3) {
      setStep((current) => (current + 1) as BookingStep);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await bookingApi.create({
        customer_name: name.trim(),
        customer_email: email.trim(),
        customer_phone: phone.trim(),
        postcode: postcode.trim(),
        service_type: service,
        frequency,
        preferred_date: date,
        preferred_time: time,
        privacy_consent: true,
        notes: notes.trim() || undefined,
      });
      setBookingReference(response.booking_id);
      setSubmitted(true);
      toast.success("Your booking request has been received.", { description: "BrightNest will review your preferred visit and service details." });
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : "We could not send your booking request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const navItems = [
    ["Services", "services"],
    ["How it works", "how-it-works"],
    ["Why BrightNest", "difference"],
    ["FAQs", "faqs"],
  ] as const;

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f8f6ef] text-[#173137]">
      <div className="bg-[#173137] px-4 py-2.5 text-center text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#f8f6ef] sm:text-xs">
        Thoughtful domestic & specialist cleaning across Birmingham & surrounding areas
      </div>

      <header className="sticky top-0 z-40 border-b border-[#173137]/10 bg-[#f8f6ef]/92 backdrop-blur-xl">
        <div className="mx-auto flex h-[76px] max-w-[1440px] items-center justify-between px-5 lg:px-10">
          <button
            className="group flex items-center gap-3 text-left"
            onClick={() => scrollToSection("top")}
            aria-label="Back to top"
          >
            <span className="brand-mark relative block h-[54px] w-[54px] overflow-hidden rounded-[20px] bg-[#d9f0e8] p-1.5 transition-transform duration-200 group-hover:-rotate-3 group-active:scale-95">
              <img
                src="/manus-storage/brightnest-logo_f888d03d.png"
                alt="BrightNest Cleaning mark"
                className="h-full w-full object-contain"
              />
            </span>
            <span className="leading-none">
              <span className="font-display block text-[27px] tracking-[-0.06em] text-[#173137]">BrightNest</span>
              <span className="block pt-1 text-[9px] font-extrabold uppercase tracking-[0.21em] text-[#2f9f91]">Cleaning UK</span>
            </span>
          </button>

          <nav className="hidden items-center gap-6 xl:gap-8 lg:flex" aria-label="Primary navigation">
            {navItems.map(([label, id]) => (
              <button
                key={id}
                onClick={() => scrollToSection(id)}
                className="text-sm font-bold text-[#173137]/75 transition-colors hover:text-[#2f9f91]"
              >
                {label}
              </button>
            ))}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <span className="hidden items-center gap-2 text-xs font-bold text-[#173137]/60 2xl:flex">
              <ShieldCheck className="h-4 w-4 text-[#2f9f91]" />
              Birmingham-based
            </span>
            <button className="btn-primary" onClick={() => bookService()}>
              Book a clean <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <button
            className="grid h-11 w-11 place-items-center rounded-full border border-[#173137]/15 text-[#173137] lg:hidden"
            onClick={() => setMobileOpen((open) => !open)}
            aria-label="Open navigation"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {mobileOpen && (
          <div className="border-t border-[#173137]/10 bg-[#f8f6ef] px-5 py-5 shadow-xl lg:hidden">
            <nav className="flex flex-col gap-1" aria-label="Mobile navigation">
              {navItems.map(([label, id]) => (
                <button
                  key={id}
                  className="flex items-center justify-between border-b border-[#173137]/10 py-4 text-left text-base font-bold"
                  onClick={() => {
                    setMobileOpen(false);
                    scrollToSection(id);
                  }}
                >
                  {label} <ArrowRight className="h-4 w-4 text-[#2f9f91]" />
                </button>
              ))}
              <button
                className="btn-primary mt-4 w-full justify-center"
                onClick={() => {
                  setMobileOpen(false);
                  bookService();
                }}
              >
                Book a clean <ArrowRight className="h-4 w-4" />
              </button>
            </nav>
          </div>
        )}
      </header>

      <main id="top">
        <section className="relative isolate overflow-hidden px-5 pb-16 pt-7 lg:px-10 lg:pb-24 lg:pt-10">
          <div className="hero-grain absolute inset-0 -z-10" />
          <div className="mx-auto grid max-w-[1440px] gap-8 lg:grid-cols-[minmax(0,0.96fr)_minmax(470px,1.04fr)] lg:items-stretch">
            <div className="flex min-h-[500px] flex-col justify-between rounded-[32px] border border-[#173137]/10 bg-[#edf3ed] p-7 sm:p-10 lg:min-h-[640px] lg:rounded-[42px] lg:p-14">
              <div className="flex items-center gap-3 text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#2f9f91] sm:text-xs">
                <span className="nestline" aria-hidden="true" />
                <span>Clean homes. Healthier spaces. Happier lives.</span>
              </div>
              <div className="max-w-[660px] py-10 lg:py-16">
                <h1 className="font-display max-w-[620px] text-[50px] leading-[0.93] tracking-[-0.065em] text-[#173137] sm:text-[68px] xl:text-[86px]">
                  Make room for <em className="font-normal text-[#2f9f91]">what matters.</em>
                </h1>
                <p className="mt-7 max-w-[510px] text-base leading-7 text-[#173137]/70 sm:text-lg sm:leading-8">
                  Thoughtful domestic and specialist cleaning that brings a calm, cared-for feeling back to your home.
                </p>
              </div>
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-7">
                <button className="btn-primary justify-center sm:justify-start" onClick={() => bookService()}>
                  Plan your clean <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  className="group inline-flex items-center justify-center gap-2 text-sm font-extrabold text-[#173137] sm:justify-start"
                  onClick={() => scrollToSection("services")}
                >
                  Explore services
                  <span className="grid h-7 w-7 place-items-center rounded-full border border-[#173137]/20 transition-all group-hover:border-[#2f9f91] group-hover:bg-[#2f9f91] group-hover:text-white">
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </button>
              </div>
            </div>

            <div className="relative min-h-[480px] overflow-hidden rounded-[32px] bg-[#d8e9df] lg:min-h-[640px] lg:rounded-[42px]">
              <img
                src="/manus-storage/brightnest-hero_530f68c1.jpg"
                alt="A BrightNest cleaner carefully preparing a living room"
                className="h-full min-h-[480px] w-full object-cover object-[72%_center] lg:min-h-[640px]"
              />
              <div className="absolute inset-x-5 top-5 flex items-start justify-between sm:inset-x-7 sm:top-7">
                <div className="rounded-full border border-white/60 bg-white/80 px-3.5 py-2 backdrop-blur-md">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.13em] text-[#173137]">Birmingham & nearby</p>
                </div>
                <div className="grid h-12 w-12 place-items-center rounded-full bg-[#2f9f91] text-white shadow-lg shadow-[#2f9f91]/25">
                  <Sparkles className="h-5 w-5" />
                </div>
              </div>
              <div className="absolute bottom-5 left-5 max-w-[275px] rounded-[22px] border border-white/60 bg-[#f8f6ef]/90 p-4 backdrop-blur-md sm:bottom-7 sm:left-7 sm:p-5">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#2f9f91]">Your time, protected</p>
                <p className="mt-2 text-sm font-bold leading-5 text-[#173137]">Choose your service, time and details in one calm booking flow.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-[#173137]/10 bg-[#f8f6ef] px-5 py-4 lg:px-10">
          <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-x-8 gap-y-3 text-xs font-extrabold uppercase tracking-[0.12em] text-[#173137]/65">
            <span className="inline-flex items-center gap-2"><HomeIcon className="h-4 w-4 text-[#2f9f91]" /> Domestic & specialist care</span>
            <span className="inline-flex items-center gap-2"><CalendarDays className="h-4 w-4 text-[#2f9f91]" /> Easy request journey</span>
            <span className="inline-flex items-center gap-2"><Sparkles className="h-4 w-4 text-[#2f9f91]" /> Made for your real life</span>
          </div>
        </section>

        <section id="services" className="scroll-mt-24 px-5 py-24 lg:px-10 lg:py-32">
          <div className="mx-auto max-w-[1440px]">
            <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
              <div>
                <p className="eyebrow">A better kind of reset</p>
                <h2 className="font-display mt-5 max-w-[510px] text-[43px] leading-[0.98] tracking-[-0.055em] sm:text-[58px]">A clean that fits the way you live.</h2>
              </div>
              <p className="max-w-[570px] text-base leading-7 text-[#173137]/70 lg:pb-2 lg:text-lg">
                From Birmingham family homes to carefully prepared short-lets, choose the service that gives your home its breathing space back. Routine services have clear starting rates; specialist work is quoted around your exact needs.
              </p>
            </div>

            <div className="mt-14 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {services.map((item, index) => (
                <article key={item.title} className={`service-card service-${item.tone} group relative min-h-[278px] overflow-hidden p-6 sm:p-7`}>
                  <div className="flex items-start justify-between">
                    <span className="service-number">0{index + 1}</span>
                    <span className="grid h-10 w-10 place-items-center rounded-full border border-current/20 transition-transform duration-200 group-hover:-rotate-12 group-hover:scale-110">
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                  <div className="absolute bottom-6 right-6 left-6 sm:bottom-7 sm:right-7 sm:left-7">
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] opacity-65">{item.eyebrow}</p>
                    <h3 className="font-display mt-2 text-[31px] leading-[0.98] tracking-[-0.045em]">{item.title}</h3>
                    <p className="mt-3 text-sm font-extrabold tracking-[-0.01em] text-[#2f9f91]">{item.price}</p>
                    <p className="mt-3 max-w-[340px] text-sm leading-6 opacity-75">{item.description}</p>
                    <button className="mt-5 inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.13em] underline decoration-current/35 underline-offset-4" onClick={() => bookService(item.title)}>
                      Request this service <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="scroll-mt-24 bg-[#173137] px-5 py-24 text-[#f8f6ef] lg:px-10 lg:py-32">
          <div className="mx-auto grid max-w-[1440px] gap-14 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="eyebrow text-[#9ee0d2]">Simple by design</p>
              <h2 className="font-display mt-5 max-w-[490px] text-[44px] leading-[0.98] tracking-[-0.055em] sm:text-[60px]">Your clean, in three considered steps.</h2>
              <button className="btn-light mt-9" onClick={() => bookService()}>
                Start a request <ArrowRight className="h-4 w-4" />
              </button>
            </div>
            <div className="divide-y divide-white/15 border-y border-white/15">
              {[
                ["01", "Choose the kind of reset", "Tell us what needs attention, plus the date and time that feels right for your week."],
                ["02", "Share a few useful details", "Add your contact information and postcode so your request has the context it needs."],
                ["03", "Confirm with clarity", "Review the plan in one place, then BrightNest can confirm the final service scope and preferred visit with you."],
              ].map(([number, title, description]) => (
                <div key={number} className="grid gap-4 py-7 sm:grid-cols-[62px_1fr] sm:gap-8 sm:py-9">
                  <span className="font-display text-2xl text-[#9ee0d2]">{number}</span>
                  <div>
                    <h3 className="text-xl font-extrabold tracking-[-0.03em] sm:text-2xl">{title}</h3>
                    <p className="mt-3 max-w-[560px] text-sm leading-6 text-white/65 sm:text-base">{description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="difference" className="scroll-mt-24 px-5 py-24 lg:px-10 lg:py-32">
          <div className="mx-auto grid max-w-[1440px] gap-8 lg:grid-cols-[0.95fr_0.7fr_0.82fr] lg:items-stretch">
            <div className="rounded-[30px] bg-[#e7ede7] p-7 sm:p-10 lg:rounded-[38px]">
              <p className="eyebrow">The BrightNest approach</p>
              <h2 className="font-display mt-5 max-w-[470px] text-[43px] leading-[0.98] tracking-[-0.055em] sm:text-[56px]">Care you can feel in the small things.</h2>
              <div className="mt-10 grid gap-5">
                {[
                  "A clear journey from service selection to booking request.",
                  "Thoughtful domestic and specialist cleaning options in one place.",
                  "A flexible foundation ready for live scheduling and payments.",
                ].map((feature) => (
                  <div key={feature} className="flex gap-3 text-sm font-bold leading-6 text-[#173137]/80">
                    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#2f9f91] text-white"><Check className="h-3 w-3" /></span>
                    {feature}
                  </div>
                ))}
              </div>
            </div>
            <figure className="relative min-h-[460px] overflow-hidden rounded-[30px] bg-[#d7e2d9] lg:rounded-[38px]">
              <img src="/manus-storage/brightnest-deep-clean_63165972.jpg" alt="A professional cleaner carefully cleaning a kitchen worktop" className="absolute inset-0 h-full w-full object-cover" />
              <figcaption className="absolute bottom-5 left-5 right-5 rounded-[19px] bg-[#173137]/88 p-4 text-sm font-bold leading-5 text-white backdrop-blur-md">
                Detail matters — especially in the spaces that hold your day together.
              </figcaption>
            </figure>
            <div className="flex min-h-[460px] flex-col justify-between rounded-[30px] bg-[#f1c9ad] p-7 text-[#173137] sm:p-9 lg:rounded-[38px]">
              <span className="grid h-12 w-12 place-items-center rounded-full bg-[#173137] text-[#f8f6ef]"><Clock3 className="h-5 w-5" /></span>
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#173137]/65">Designed around you</p>
                <p className="font-display mt-4 text-[34px] leading-[1.02] tracking-[-0.045em]">Less time organising. More time enjoying your space.</p>
                <button className="mt-7 inline-flex items-center gap-2 text-sm font-extrabold underline decoration-[#173137]/35 underline-offset-4" onClick={() => bookService()}>
                  Find your service <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </section>

        <section id="client-feedback" className="scroll-mt-24 bg-[#173137] px-5 py-24 text-[#f8f6ef] lg:px-10 lg:py-32">
          <div className="mx-auto grid max-w-[1440px] gap-10 lg:grid-cols-[0.9fr_0.7fr] lg:items-center lg:gap-20">
            <div className="max-w-[610px]">
              <p className="eyebrow text-[#9ee0d2]">Customer feedback</p>
              <h2 className="font-display mt-5 text-[46px] leading-[0.97] tracking-[-0.06em] sm:text-[64px]">Care you can see. Relief you can feel.</h2>
              <blockquote className="testimonial-quote mt-10">
                <span aria-hidden="true">“</span>
                <p>It looks amazing, we are beyond grateful!</p>
              </blockquote>
              <p className="mt-7 max-w-[520px] text-base leading-7 text-white/65">A real message shared by a BrightNest client after their cleaning visit. The original feedback is shown here with BrightNest branding, while keeping the customer’s words intact.</p>
              <div className="mt-8 flex items-center gap-3 text-xs font-extrabold uppercase tracking-[0.12em] text-[#9ee0d2]"><span className="grid h-8 w-8 place-items-center rounded-full border border-[#9ee0d2]/35"><Check className="h-4 w-4" /></span> Verified feedback supplied by BrightNest</div>
            </div>
            <figure className="testimonial-proof-card">
              <div className="testimonial-proof-glow" aria-hidden="true" />
              <img src="/manus-storage/brightnest-client-feedback_2fd077cc.png" alt="BrightNest client feedback showing an authentic customer message after a cleaning visit" className="relative z-10 w-full rounded-[22px] border border-white/15 shadow-[0_26px_70px_rgba(0,0,0,0.36)]" />
              <figcaption className="relative z-10 mt-4 flex items-center justify-between gap-4 px-1 text-xs font-bold text-white/55"><span>Authentic customer feedback</span><span>Shared after service</span></figcaption>
            </figure>
          </div>
        </section>

        <section className="px-5 pb-24 lg:px-10 lg:pb-32">
          <div className="mx-auto grid max-w-[1440px] overflow-hidden rounded-[32px] bg-[#dbece4] lg:grid-cols-[0.95fr_1.05fr] lg:rounded-[42px]">
            <div className="order-2 px-7 py-10 sm:px-10 sm:py-14 lg:order-1 lg:px-16 lg:py-20">
              <p className="eyebrow">Guest-ready details</p>
              <h2 className="font-display mt-5 max-w-[510px] text-[42px] leading-[0.98] tracking-[-0.055em] sm:text-[58px]">For homes that welcome people in.</h2>
              <p className="mt-6 max-w-[540px] text-base leading-7 text-[#173137]/70">Add the details that make the difference for move-out, short-let and special-occasion cleans.</p>
              <div className="mt-9 grid grid-cols-2 gap-x-6 gap-y-4">
                {["Linen change", "Fridge interior", "Oven detail", "Cupboard interiors", "Carpet care", "After-builders reset"].map((item) => (
                  <span key={item} className="flex items-center gap-2 text-sm font-extrabold"><Sparkles className="h-4 w-4 text-[#2f9f91]" /> {item}</span>
                ))}
              </div>
              <button className="btn-primary mt-10" onClick={() => bookService("Airbnb turnovers")}>
                Plan a guest-ready clean <ArrowRight className="h-4 w-4" />
              </button>
            </div>
            <div className="order-1 min-h-[380px] lg:order-2 lg:min-h-full">
              <img src="/manus-storage/brightnest-airbnb_03620299.jpg" alt="A fresh guest-ready apartment bedroom" className="h-full min-h-[380px] w-full object-cover" />
            </div>
          </div>
        </section>

        <section id="booking" className="scroll-mt-24 bg-[#f2efe4] px-5 py-24 lg:px-10 lg:py-32">
          <div className="mx-auto max-w-[1440px]">
            <div className="grid gap-10 lg:grid-cols-[0.76fr_1.24fr] lg:gap-16">
              <div className="lg:pt-6">
                <p className="eyebrow">Booking request</p>
                <h2 className="font-display mt-5 max-w-[490px] text-[45px] leading-[0.96] tracking-[-0.06em] sm:text-[63px]">A few details, then a cleaner plan.</h2>
                <p className="mt-7 max-w-[470px] text-base leading-7 text-[#173137]/70">Choose your preferred visit and tell us what matters at home. Starting rates are shown in the service guide; specialist requests are quoted around your space and scope.</p>
                <div className="mt-10 flex gap-4 border-t border-[#173137]/15 pt-6 text-sm font-bold leading-6 text-[#173137]/70">
                  <ShieldCheck className="h-5 w-5 shrink-0 text-[#2f9f91]" />
                  A preferred time, postcode and a few home details help shape the right cleaning request.
                </div>
              </div>

              <div className="rounded-[30px] bg-[#173137] p-5 text-[#f8f6ef] shadow-2xl shadow-[#173137]/10 sm:p-8 lg:rounded-[38px] lg:p-10">
                {!submitted ? (
                  <form onSubmit={advanceBooking} aria-busy={isSubmitting}>
                    <div className="mb-9 grid grid-cols-3 gap-2 sm:gap-4">
                      {[
                        [1, "Service & visit"],
                        [2, "Your details"],
                        [3, "Confirm request"],
                      ].map(([number, label]) => {
                        const current = Number(number) as BookingStep;
                        return (
                          <button
                            type="button"
                            key={number}
                            disabled={current > step}
                            onClick={() => current <= step && setStep(current)}
                            className={`booking-step ${step === current ? "booking-step-current" : current < step ? "booking-step-done" : ""}`}
                          >
                            <span>{number}</span>
                            <small>{label}</small>
                          </button>
                        );
                      })}
                    </div>

                    {step === 1 && (
                      <div className="booking-panel">
                        <div>
                          <label htmlFor="service" className="field-label">Which service feels right?</label>
                          <select id="service" value={service} onChange={(event) => setService(event.target.value)} className="field-control" required>
                            <option value="">Choose a service</option>
                            {services.map((item) => <option key={item.title} value={item.title}>{item.title} — {item.price}</option>)}
                            <option value="Tailored / other request">Tailored / other request</option>
                          </select>
                        </div>
                        <div>
                          <label htmlFor="frequency" className="field-label">Visit rhythm</label>
                          <select id="frequency" value={frequency} onChange={(event) => setFrequency(event.target.value)} className="field-control">
                            <option>One-off visit</option>
                            <option>Weekly</option>
                            <option>Fortnightly</option>
                            <option>Monthly</option>
                          </select>
                        </div>
                        <div className="grid gap-5 sm:grid-cols-2">
                          <div>
                            <label htmlFor="date" className="field-label">Preferred date</label>
                            <input id="date" type="date" min={minimumDate} value={date} onChange={(event) => setDate(event.target.value)} className="field-control" required />
                          </div>
                          <div>
                            <label htmlFor="time" className="field-label">Preferred time</label>
                            <input id="time" type="time" value={time} onChange={(event) => setTime(event.target.value)} className="field-control" required />
                          </div>
                        </div>
                      </div>
                    )}

                    {step === 2 && (
                      <div className="booking-panel">
                        <div className="grid gap-5 sm:grid-cols-2">
                          <div>
                            <label htmlFor="name" className="field-label">Your name</label>
                            <input id="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Your full name" className="field-control" required />
                          </div>
                          <div>
                            <label htmlFor="postcode" className="field-label">Your postcode</label>
                            <input id="postcode" value={postcode} onChange={(event) => setPostcode(event.target.value)} placeholder="e.g. B1 1AA" className="field-control" required />
                          </div>
                        </div>
                        <div>
                          <label htmlFor="email" className="field-label">Email address</label>
                          <div className="field-validation-wrap">
                            <input id="email" type="email" inputMode="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} onBlur={() => setEmailTouched(true)} placeholder="you@example.com" className={`field-control ${emailError ? "field-control-error" : emailTouched && emailIsValid ? "field-control-valid" : ""}`} aria-invalid={Boolean(emailError)} aria-describedby="email-help" required />
                            {emailTouched && emailIsValid && <span className="field-validation-icon field-validation-icon-valid" aria-hidden="true"><Check className="h-3.5 w-3.5" /></span>}
                          </div>
                          <p id="email-help" className={`field-validation-message ${emailError ? "field-validation-message-error" : emailTouched && emailIsValid ? "field-validation-message-valid" : ""}`} aria-live="polite">{emailError || (emailTouched && emailIsValid ? "Email address looks good." : "We will only use this to confirm your request.")}</p>
                        </div>
                        <div>
                          <label htmlFor="phone" className="field-label">Phone number</label>
                          <div className="field-validation-wrap">
                            <input id="phone" type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={(event) => setPhone(event.target.value)} onBlur={() => setPhoneTouched(true)} placeholder="e.g. 07123 456789" className={`field-control ${phoneError ? "field-control-error" : phoneTouched && phoneIsValid ? "field-control-valid" : ""}`} aria-invalid={Boolean(phoneError)} aria-describedby="phone-help" required />
                            {phoneTouched && phoneIsValid && <span className="field-validation-icon field-validation-icon-valid" aria-hidden="true"><Check className="h-3.5 w-3.5" /></span>}
                          </div>
                          <p id="phone-help" className={`field-validation-message ${phoneError ? "field-validation-message-error" : phoneTouched && phoneIsValid ? "field-validation-message-valid" : ""}`} aria-live="polite">{phoneError || (phoneTouched && phoneIsValid ? "Phone number looks good." : "Use a UK number beginning 0 or +44.")}</p>
                        </div>
                        <div>
                          <label htmlFor="notes" className="field-label">Anything helpful to know? <span className="normal-case tracking-normal text-white/45">(optional)</span></label>
                          <textarea id="notes" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Tell us about rooms, access or specific priorities." className="field-control min-h-[118px] resize-y" />
                        </div>
                      </div>
                    )}

                    {step === 3 && (
                      <div className="booking-panel">
                        <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#9ee0d2]">Your visit snapshot</p>
                        <div className="mt-4 divide-y divide-white/12 rounded-[18px] border border-white/15 bg-white/5 px-5">
                          {[
                            ["Service", service],
                            ["Visit rhythm", frequency],
                            ["Preferred slot", `${date} at ${time}`],
                            ["For", `${name} · ${postcode}`],
                            ["Email", email],
                            ["Phone", phone],
                          ].map(([label, value]) => (
                            <div key={label} className="flex flex-col gap-1 py-3.5 sm:flex-row sm:items-center sm:justify-between">
                              <span className="text-xs font-extrabold uppercase tracking-[0.12em] text-white/45">{label}</span>
                              <span className="text-sm font-bold text-white">{value}</span>
                            </div>
                          ))}
                        </div>
                        {notes && <p className="mt-4 rounded-[16px] bg-[#2f9f91]/15 px-4 py-3 text-sm leading-6 text-white/75">“{notes}”</p>}
                        <p className="mt-5 text-sm leading-6 text-white/60">Submitting sends your request securely to BrightNest. Your preferred visit is confirmed once the service details are reviewed.</p>
                      </div>
                    )}

                    {step === 3 && (
                      <div className={`privacy-consent ${privacyTouched && !privacyConsent ? "privacy-consent-error" : ""}`}>
                        <input id="privacy-consent" type="checkbox" checked={privacyConsent} onChange={(event) => { setPrivacyConsent(event.target.checked); setPrivacyTouched(true); if (event.target.checked) setFormError(""); }} aria-invalid={privacyTouched && !privacyConsent} aria-describedby="privacy-consent-help" />
                        <label htmlFor="privacy-consent"><strong>I consent to BrightNest using my details under its Privacy Policy</strong> to assess and respond to this booking request.</label>
                        <p id="privacy-consent-help" className="privacy-consent-help" aria-live="polite">{privacyTouched && !privacyConsent ? "Your consent is required before this request can be sent." : <>Required to send your booking request. <Link href="/privacy-policy" className="underline decoration-current/45 underline-offset-2">Read the Privacy Policy</Link>.</>}</p>
                      </div>
                    )}

                    {isSubmitting && (
                      <div className="booking-loading" role="status" aria-live="polite">
                        <span className="booking-loading-orb"><LoaderCircle className="h-4 w-4 animate-spin" /></span>
                        <span><strong>Sending your request securely</strong><small>BrightNest is recording your preferred visit and home details.</small></span>
                      </div>
                    )}
                    {formError && <p role="alert" className="mt-5 rounded-xl bg-[#f1c9ad] px-4 py-3 text-sm font-bold text-[#173137]">{formError}</p>}
                    <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                      {step > 1 ? <button type="button" className="btn-ghost-light" disabled={isSubmitting} onClick={() => setStep((current) => (current - 1) as BookingStep)}>Back</button> : <span />}
                      <button type="submit" className="btn-mint justify-center" disabled={isSubmitting}>
                        {isSubmitting ? <><LoaderCircle className="h-4 w-4 animate-spin" /> Sending request…</> : <>{step === 3 ? "Send request" : "Continue"} <ArrowRight className="h-4 w-4" /></>}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="booking-success flex min-h-[500px] flex-col items-center justify-center px-3 text-center sm:px-10" role="status" aria-live="polite">
                    <div className="booking-success-seal"><span className="booking-success-orbit booking-success-orbit-one" /><span className="booking-success-orbit booking-success-orbit-two" /><span className="relative z-10 grid h-16 w-16 place-items-center rounded-full bg-[#2f9f91] text-white shadow-lg shadow-[#2f9f91]/30"><Check className="h-7 w-7" /></span></div>
                    <p className="eyebrow mt-9 text-[#9ee0d2]">Request received</p>
                    <h3 className="font-display mt-4 max-w-[480px] text-[46px] leading-[0.96] tracking-[-0.055em] sm:text-[58px]">Your clean is now in the right hands.</h3>
                    <p className="mt-6 max-w-[490px] text-sm leading-7 text-white/65 sm:text-base">BrightNest has your preferred service, time and home details. The team will confirm the next step with you.</p>
                    {bookingReference && <p className="mt-5 rounded-full border border-white/20 px-4 py-2 text-xs font-extrabold tracking-[0.1em] text-[#9ee0d2]">REFERENCE · {bookingReference.slice(0, 8).toUpperCase()}</p>}
                    <div className="mt-8 grid w-full max-w-[470px] gap-2 text-left sm:grid-cols-3">
                      {["Request logged", "Details reviewed", "Visit confirmed"].map((item, index) => <div key={item} className="booking-success-step"><span>0{index + 1}</span><p>{item}</p></div>)}
                    </div>
                    <button className="btn-light mt-9" onClick={() => { setSubmitted(false); setStep(1); setBookingReference(""); setPrivacyConsent(false); setPrivacyTouched(false); }}>
                      Start another request <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <section id="faqs" className="scroll-mt-24 px-5 py-24 lg:px-10 lg:py-32">
          <div className="mx-auto grid max-w-[1440px] gap-10 lg:grid-cols-[0.76fr_1.24fr] lg:gap-16">
            <div>
              <p className="eyebrow">Helpful answers</p>
              <h2 className="font-display mt-5 max-w-[440px] text-[44px] leading-[0.98] tracking-[-0.055em] sm:text-[57px]">A little more clarity, before you book.</h2>
              <p className="mt-6 max-w-[400px] text-base leading-7 text-[#173137]/70">Clear answers about requesting a clean, confirming a visit, changing plans and getting support if something needs attention.</p>
            </div>
            <div className="border-t border-[#173137]/15">
              {faqs.map((item) => (
                <details key={item.question} className="faq-item group border-b border-[#173137]/15 py-1">
                  <summary className="flex list-none items-center justify-between gap-6 py-5 text-left text-base font-extrabold tracking-[-0.02em] sm:py-6 sm:text-lg">
                    {item.question}
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-[#173137]/15 text-[#2f9f91] transition-transform duration-200 group-open:rotate-180"><ChevronDown className="h-4 w-4" /></span>
                  </summary>
                  <div className="max-w-[720px] pb-6 pr-10"><p className="text-sm leading-7 text-[#173137]/70 sm:text-base">{item.answer}</p>{item.link && <Link href={item.link.href} className="mt-3 inline-flex text-xs font-extrabold uppercase tracking-[0.1em] text-[#2f9f91] underline decoration-[#2f9f91]/40 underline-offset-4">{item.link.label} <ArrowRight className="ml-1 h-3.5 w-3.5" /></Link>}</div>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="px-5 pb-16 lg:px-10 lg:pb-20">
          <div className="mx-auto max-w-[1440px] rounded-[30px] bg-[#2f9f91] px-7 py-12 text-white sm:px-10 lg:grid lg:grid-cols-[1fr_auto] lg:items-end lg:gap-10 lg:rounded-[40px] lg:px-16 lg:py-16">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-white/70">A fresh start is close</p>
              <h2 className="font-display mt-4 max-w-[670px] text-[43px] leading-[0.98] tracking-[-0.055em] sm:text-[60px]">Your home already has the potential. Let’s uncover it.</h2>
            </div>
            <button className="btn-dark mt-8 lg:mt-0" onClick={() => bookService()}>
              Plan your clean <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </section>
      </main>

      <footer className="bg-[#173137] px-5 pb-8 pt-14 text-[#f8f6ef] lg:px-10 lg:pt-18">
        <div className="mx-auto grid max-w-[1440px] gap-10 border-b border-white/15 pb-12 md:grid-cols-[1.25fr_0.75fr_0.75fr]">
          <div>
            <div className="flex items-center gap-3">
              <span className="brand-mark block h-[54px] w-[54px] rounded-[20px] bg-[#d9f0e8] p-1.5"><img src="/manus-storage/brightnest-logo_f888d03d.png" alt="BrightNest Cleaning mark" className="h-full w-full object-contain" /></span>
              <span className="font-display text-[28px] tracking-[-0.05em]">BrightNest</span>
            </div>
            <p className="mt-6 max-w-[360px] text-sm leading-7 text-white/60">Thoughtful domestic and specialist cleaning across Birmingham and surrounding areas.</p>
          </div>
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#9ee0d2]">Explore</p>
            <div className="mt-5 flex flex-col gap-3 text-sm font-bold text-white/70">
              {navItems.map(([label, id]) => <button key={id} onClick={() => scrollToSection(id)} className="text-left transition-colors hover:text-white">{label}</button>)}
            </div>
          </div>
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#9ee0d2]">Book</p>
            <p className="mt-5 text-sm leading-7 text-white/60">Need a tailored home or specialist cleaning request?</p>
            <button onClick={() => bookService()} className="mt-4 inline-flex items-center gap-2 text-sm font-extrabold text-white underline decoration-[#9ee0d2] decoration-2 underline-offset-4">Start your request <ArrowRight className="h-4 w-4" /></button>
          </div>
        </div>
        <div className="mx-auto flex max-w-[1440px] flex-col gap-3 pt-6 text-[11px] font-bold text-white/40 sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} BrightNest Cleaning UK. All rights reserved.</span>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1"><Link href="/privacy-policy" className="transition-colors hover:text-white">Privacy Policy</Link><span aria-hidden="true">·</span><Link href="/terms-of-service" className="transition-colors hover:text-white">Terms of Service</Link></div>
        </div>
      </footer>
    </div>
  );
}
