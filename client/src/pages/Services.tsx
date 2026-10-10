import { ArrowLeft, ArrowRight, Check, Menu, MessageCircle, Phone, Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useRoute } from "wouter";
import { CONTACT_PHONE_DISPLAY, CONTACT_PHONE_HREF, WHATSAPP_HREF } from "@/lib/contact";
import { applySeo, SITE_URL } from "@/lib/seo";

type Service = {
  slug: string;
  title: string;
  eyebrow: string;
  description: string;
  intro: string;
  price: string;
  included: string[];
  idealFor: string[];
  faqs: { question: string; answer: string }[];
};

const services: Service[] = [
  {
    slug: "regular-home-cleaning",
    title: "Regular Home Cleaning",
    eyebrow: "A calmer weekly rhythm",
    description: "Reliable regular home cleaning for UK households that want a fresh, cared-for space without the weekend reset.",
    intro: "Build a cleaning rhythm around the way your home is used. BrightNest regular home cleaning keeps everyday surfaces, floors, kitchens and bathrooms feeling ready for the week ahead.",
    price: "From £25 per hour",
    included: ["Kitchen surfaces, sinks and outside appliances", "Bathrooms, mirrors and high-touch areas", "Dusting, vacuuming and mopping", "Bedrooms, living spaces and entranceways", "A clear visit plan shaped around your priorities"],
    idealFor: ["Busy households", "Families and professionals", "Homes that need a dependable routine", "Customers looking for weekly, fortnightly or monthly visits"],
    faqs: [{ question: "How often can I book regular cleaning?", answer: "You can request a one-off, weekly, fortnightly or monthly visit. The team will confirm availability and the right scope for your home." }, { question: "Can I choose my priorities?", answer: "Yes. Add your priorities in the booking notes and BrightNest will review them when confirming the request." }],
  },
  {
    slug: "deep-cleaning",
    title: "Deep Cleaning",
    eyebrow: "A thorough reset",
    description: "Detailed deep cleaning for kitchens, bathrooms, living spaces and overlooked areas across the UK.",
    intro: "A deep clean gives the spaces that carry your day a more complete reset. BrightNest works through the detail in a considered order, from visible surfaces to the corners that are easy to miss.",
    price: "From £30 per hour",
    included: ["Detailed kitchen and bathroom cleaning", "Skirting boards, doors and reachable edges", "High-touch points and visible build-up", "Room-by-room vacuuming and floor care", "Scope reviewed around the property and access"],
    idealFor: ["Seasonal resets", "Homes preparing for guests", "Post-illness or busy periods", "Customers who want a deeper one-off clean"],
    faqs: [{ question: "How long does a deep clean take?", answer: "Time depends on property size, condition and requested scope. BrightNest reviews your details before confirming the visit." }, { question: "Is deep cleaning available across the UK?", answer: "BrightNest accepts UK postcode requests. Availability, travel and final scope are confirmed for each booking." }],
  },
  {
    slug: "end-of-tenancy-cleaning",
    title: "End of Tenancy Cleaning",
    eyebrow: "A smoother handover",
    description: "End of tenancy cleaning for tenants, landlords and property teams preparing a home for its next chapter.",
    intro: "A well-prepared handover needs attention to the details people notice first. BrightNest helps reset kitchens, bathrooms, floors and living spaces around your agreed moving schedule.",
    price: "From £35 per hour",
    included: ["Kitchen units, surfaces and appliance exteriors", "Bathrooms, sanitaryware, taps and mirrors", "Vacuuming and mopping throughout", "Internal windows or specialist add-ons by request", "A scope shaped around property size and condition"],
    idealFor: ["Tenants preparing to move out", "Landlords between tenancies", "Letting agents and property managers", "Move-out schedules with a clear deadline"],
    faqs: [{ question: "Can I add oven or window cleaning?", answer: "Yes. Add-ons such as oven, fridge and reachable internal window cleaning can be requested through the booking form." }, { question: "Is the service an inventory guarantee?", answer: "Cleaning helps prepare a property, but a deposit or inventory outcome depends on the tenancy agreement, property condition and inspection." }],
  },
  {
    slug: "move-in-move-out-cleaning",
    title: "Move-In & Move-Out Cleaning",
    eyebrow: "A fresh start",
    description: "Move-in and move-out cleaning for UK homes that need a clear, comfortable start before keys change hands.",
    intro: "Moving brings enough decisions already. BrightNest gives the home a considered reset so you can settle in, hand over or prepare the next stage with less cleaning to organise.",
    price: "From £35 per hour",
    included: ["Room-by-room surface cleaning", "Kitchen and bathroom detail", "Reachable floors, edges and high-touch points", "Property-specific priorities reviewed in advance", "Optional appliance and window add-ons"],
    idealFor: ["New homeowners and renters", "Families moving between homes", "Landlords preparing keys", "Property teams coordinating a handover"],
    faqs: [{ question: "Can I book before I receive the keys?", answer: "You can submit a request with the expected date. BrightNest will confirm the visit once access and availability are clear." }, { question: "Do you clean empty properties?", answer: "Yes, empty properties can make the scope easier to plan. Please include access details and any restrictions in your request." }],
  },
  {
    slug: "office-commercial-cleaning",
    title: "Office & Commercial Cleaning",
    eyebrow: "Clearer working spaces",
    description: "Office and commercial cleaning for UK workplaces, shared spaces and customer-facing environments.",
    intro: "A considered workplace clean supports the people who use it every day. BrightNest can shape a practical request around access, touchpoints, shared areas and the rhythm of your business.",
    price: "From £30 per hour",
    included: ["Desks, shared surfaces and touchpoints", "Kitchen, refreshment and welfare areas", "Floors, entrances and visible presentation areas", "Flexible one-off or recurring requests", "Scope reviewed around access and working hours"],
    idealFor: ["Small offices", "Studios and local businesses", "Short-term rental operations", "Workplaces needing a reliable reset"],
    faqs: [{ question: "Can you clean outside normal office hours?", answer: "Add your preferred timing and access details to the request. BrightNest will confirm what is available for your location." }, { question: "Can I request recurring commercial cleaning?", answer: "Yes. Weekly, fortnightly and monthly rhythms can be requested, subject to availability and an agreed scope." }],
  },
  {
    slug: "window-cleaning",
    title: "Window Cleaning",
    eyebrow: "More light, less build-up",
    description: "Window cleaning for reachable glass, frames and sills, with a tailored quote based on access and finish required.",
    intro: "Clearer windows change how a room feels. BrightNest reviews the glass, frames, access and finish you need before confirming a window-cleaning request.",
    price: "Quote based",
    included: ["Reachable internal glass by request", "Frames, sills and visible edges", "Access and property-specific scope review", "Careful finish appropriate to the surface", "Optional combination with a wider clean"],
    idealFor: ["Seasonal home refreshes", "Rental and guest-ready properties", "Homes with reachable internal glass", "Businesses needing a clearer presentation"],
    faqs: [{ question: "Is external window cleaning included?", answer: "Window access and safe working conditions are reviewed before confirmation. Describe the windows and access in your request." }, { question: "How is the price calculated?", answer: "The quote depends on the number of windows, access, condition and the internal or external scope requested." }],
  },
  {
    slug: "oven-cleaning",
    title: "Oven Cleaning",
    eyebrow: "A focused kitchen detail",
    description: "Oven cleaning for the appliance that works hardest, with a careful scope for racks, reachable surfaces and build-up.",
    intro: "A clean oven can change how the whole kitchen feels. BrightNest approaches the appliance detail carefully, reviewing its condition and the parts that need attention before confirming the request.",
    price: "From £80 extra",
    included: ["Reachable interior surfaces", "Racks and shelves where suitable", "Door glass and surrounding surfaces", "A scope reviewed around appliance condition", "Optional combination with a home clean"],
    idealFor: ["End-of-tenancy preparation", "Seasonal kitchen resets", "Homes preparing for guests", "Customers adding detail to a wider clean"],
    faqs: [{ question: "Does oven cleaning include every appliance part?", answer: "The exact scope depends on appliance design, condition and safe access. BrightNest confirms the practical details before the visit." }, { question: "Can I add oven cleaning to another service?", answer: "Yes. Select or mention the oven add-on in your booking request." }],
  },
  {
    slug: "bin-cleaning",
    title: "Bin Cleaning",
    eyebrow: "A fresher everyday detail",
    description: "Bin cleaning for UK homes and properties that want a fresher, more considered finish around household waste containers.",
    intro: "Bins are a small detail that can make a noticeable difference. BrightNest reviews the container type, access and requested finish before confirming a bin-cleaning visit.",
    price: "Quote based",
    included: ["Household bin exterior and reachable surfaces", "A job-specific scope based on condition", "Access and collection timing review", "Optional combination with other cleaning", "Clear confirmation before the visit"],
    idealFor: ["Households wanting a fresher bin area", "Rental and managed properties", "Seasonal or one-off requests", "Customers adding a practical specialist detail"],
    faqs: [{ question: "Do I need to leave the bin empty?", answer: "Please include collection and access details in your request so BrightNest can confirm the most practical arrangement." }, { question: "Is bin cleaning available anywhere in the UK?", answer: "UK postcode requests are accepted and availability is confirmed based on the location, access and requested scope." }],
  },
];

function ServiceMetadata({ service }: { service?: Service }) {
  useEffect(() => {
    if (!service) {
      applySeo({ title: "Cleaning Services UK | BrightNest Cleaning UK", description: "Explore BrightNest domestic and specialist cleaning services available across the UK.", path: "/services" });
      return;
    }
    const path = `/services/${service.slug}`;
    const serviceSchema = {
      "@context": "https://schema.org",
      "@type": "Service",
      name: service.title,
      description: service.description,
      provider: { "@type": "CleaningService", name: "BrightNest Cleaning UK", url: SITE_URL, telephone: "+447859293986" },
      areaServed: { "@type": "Country", name: "United Kingdom" },
      serviceType: service.title,
      url: `${SITE_URL}${path}`,
    };
    const faqSchema = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: service.faqs.map((faq) => ({ "@type": "Question", name: faq.question, acceptedAnswer: { "@type": "Answer", text: faq.answer } })) };
    const breadcrumb = { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: SITE_URL }, { "@type": "ListItem", position: 2, name: "Services", item: `${SITE_URL}/services` }, { "@type": "ListItem", position: 3, name: service.title, item: `${SITE_URL}${path}` }] };
    applySeo({ title: `${service.title} UK | BrightNest Cleaning UK`, description: service.description, path, jsonLd: [serviceSchema, faqSchema, breadcrumb] });
  }, [service]);
  return null;
}

function ServiceHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigation = [
    ["Home", "/"],
    ["About us", "/#difference"],
    ["Services", "/services"],
    ["Blog", "/blog"],
    ["Contact", "/#booking"],
  ] as const;

  return <>
    <div className="bg-[#173137] px-4 py-2.5 text-center text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#f8f6ef] sm:text-xs">
      Thoughtful domestic &amp; specialist cleaning across the UK
    </div>
    <header className="sticky top-0 z-40 px-3 pt-3 sm:px-5 lg:px-8">
      <div className="mx-auto flex min-h-[72px] max-w-[1440px] items-center justify-between gap-5 rounded-full border border-[#173137]/12 bg-[#fffdf7]/95 px-4 shadow-[0_10px_30px_rgba(23,49,55,0.08)] backdrop-blur-xl sm:min-h-[76px] sm:px-5 lg:px-7">
        <Link href="/" className="group flex shrink-0 items-center" aria-label="BrightNest Cleaning UK home">
          <img src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663898260788/pQUupKLjmRbDVtER.webp" alt="BrightNest Cleaning UK logo" className="h-[62px] w-[166px] origin-left scale-[1.12] object-contain object-left transition-transform duration-200 group-hover:scale-[1.16] group-active:scale-95 sm:h-[68px] sm:w-[184px]" />
        </Link>
        <nav className="hidden items-center gap-5 lg:flex xl:gap-7" aria-label="Primary navigation">
          {navigation.map(([label, href]) => label === "Services" ? (
            <Link key={href} href={href} className="strict-nav-link strict-nav-link-active" aria-current="page">{label}</Link>
          ) : href.startsWith("/#") ? (
            <a key={href} href={href} className="strict-nav-link">{label}</a>
          ) : (
            <Link key={href} href={href} className="strict-nav-link">{label}</Link>
          ))}
        </nav>
        <div className="hidden items-center gap-3 lg:flex">
          <a href={CONTACT_PHONE_HREF} className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#173137]/70 transition-colors hover:text-[#23786f]" aria-label={`Call BrightNest on ${CONTACT_PHONE_DISPLAY}`}>
            <Phone className="h-3.5 w-3.5" /> Call us
          </a>
          <Link href="/dashboard" className="text-sm font-bold text-[#173137]/78 transition-colors hover:text-[#23786f]">My bookings</Link>
          <Link href="/#booking" className="btn-primary">Book a clean <ArrowRight className="h-4 w-4" /></Link>
        </div>
        <button className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-[#173137]/15 text-[#173137] lg:hidden" onClick={() => setMobileOpen((open) => !open)} aria-label={mobileOpen ? "Close navigation" : "Open navigation"} aria-expanded={mobileOpen} aria-controls="services-mobile-navigation">
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {mobileOpen && <div id="services-mobile-navigation" className="border-t border-[#173137]/10 bg-[#f8f6ef] px-5 py-4 shadow-xl lg:hidden">
        <nav className="flex flex-col" aria-label="Mobile navigation">
          {navigation.map(([label, href]) => label === "Services" ? (
            <Link key={href} href={href} onClick={() => setMobileOpen(false)} className="flex items-center justify-between border-b border-[#173137]/10 py-4 text-left text-base font-bold text-[#23786f]" aria-current="page">{label}<ArrowRight className="h-4 w-4 text-[#23786f]" /></Link>
          ) : href.startsWith("/#") ? (
            <a key={href} href={href} onClick={() => setMobileOpen(false)} className="flex items-center justify-between border-b border-[#173137]/10 py-4 text-left text-base font-bold">{label}<ArrowRight className="h-4 w-4 text-[#23786f]" /></a>
          ) : (
            <Link key={href} href={href} onClick={() => setMobileOpen(false)} className="flex items-center justify-between border-b border-[#173137]/10 py-4 text-left text-base font-bold">{label}<ArrowRight className="h-4 w-4 text-[#23786f]" /></Link>
          ))}
          <a href={CONTACT_PHONE_HREF} onClick={() => setMobileOpen(false)} className="flex items-center justify-between border-b border-[#173137]/10 py-4 text-left text-base font-bold">Call {CONTACT_PHONE_DISPLAY}<Phone className="h-4 w-4 text-[#23786f]" /></a>
          <a href={WHATSAPP_HREF} target="_blank" rel="noreferrer" onClick={() => setMobileOpen(false)} className="flex items-center justify-between border-b border-[#173137]/10 py-4 text-left text-base font-bold">WhatsApp us <MessageCircle className="h-4 w-4 text-[#23786f]" /></a>
          <Link href="/dashboard" onClick={() => setMobileOpen(false)} className="flex items-center justify-between border-b border-[#173137]/10 py-4 text-left text-base font-bold">My bookings <ArrowRight className="h-4 w-4 text-[#23786f]" /></Link>
          <Link href="/#booking" onClick={() => setMobileOpen(false)} className="btn-primary mt-4 w-full justify-center">Book a clean <ArrowRight className="h-4 w-4" /></Link>
        </nav>
      </div>}
    </header>
  </>;
}

function ServicePage({ service }: { service: Service }) {
  return <div className="min-h-screen bg-[#f8f6ef] text-[#173137]"><ServiceMetadata service={service} /><ServiceHeader /><main><section className="px-5 pb-14 pt-8 sm:pb-20 sm:pt-12 lg:px-10 lg:pb-28 lg:pt-16"><div className="mx-auto max-w-[1220px]"><Link href="/services" className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.14em] text-[#23786f]"><ArrowLeft className="h-4 w-4" /> All services</Link><div className="mt-8 grid gap-7 lg:grid-cols-[1.1fr_0.9fr] lg:items-end"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#23786f]">{service.eyebrow}</p><h1 className="font-display mt-5 max-w-[800px] text-[52px] leading-[0.92] tracking-[-0.065em] sm:text-[76px]">{service.title} across the UK.</h1><p className="mt-7 max-w-[670px] text-base leading-7 text-[#173137]/72 sm:text-lg sm:leading-8">{service.description}</p><div className="mt-8 flex flex-wrap gap-3"><Link href="/#booking" className="inline-flex items-center gap-2 rounded-full bg-[#173137] px-5 py-3 text-sm font-extrabold text-[#f8f6ef]">Request this clean <ArrowRight className="h-4 w-4" /></Link><a href={WHATSAPP_HREF} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-[#173137]/15 px-5 py-3 text-sm font-extrabold text-[#173137]"><MessageCircle className="h-4 w-4 text-[#23786f]" /> Ask on WhatsApp</a></div></div><div className="rounded-[28px] bg-[#d9f0e8] p-7 sm:p-9"><Sparkles className="h-7 w-7 text-[#23786f]" /><p className="mt-8 text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#23786f]">Guide price</p><p className="font-display mt-3 text-4xl tracking-[-0.05em]">{service.price}</p><p className="mt-4 text-sm leading-6 text-[#173137]/70">Final scope and availability are confirmed around your postcode, property and preferred timing.</p></div></div></div></section><section className="bg-[#173137] px-5 py-14 text-[#f8f6ef] sm:py-20 lg:px-10"><div className="mx-auto grid max-w-[1220px] gap-8 lg:grid-cols-2"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#9ee0d2]">What is included</p><h2 className="font-display mt-4 max-w-[520px] text-4xl leading-none tracking-[-0.05em] sm:text-5xl">A considered scope for your space.</h2></div><ul className="grid gap-4 sm:grid-cols-2">{service.included.map((item) => <li key={item} className="flex gap-3 border-t border-white/15 pt-4 text-sm font-bold leading-6 text-white/80"><Check className="mt-1 h-4 w-4 shrink-0 text-[#9ee0d2]" />{item}</li>)}</ul></div></section><section className="px-5 py-14 sm:py-20 lg:px-10 lg:py-24"><div className="mx-auto grid max-w-[1220px] gap-10 lg:grid-cols-[0.8fr_1.2fr]"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#23786f]">A good fit for</p><h2 className="font-display mt-4 text-4xl tracking-[-0.05em] sm:text-5xl">Made around real routines.</h2></div><div className="grid gap-3 sm:grid-cols-2">{service.idealFor.map((item) => <div key={item} className="rounded-[18px] bg-white p-5 text-sm font-bold leading-6 shadow-[0_10px_30px_rgba(23,49,55,0.06)]">{item}</div>)}</div></div></section><section className="px-5 pb-16 sm:pb-24 lg:px-10"><div className="mx-auto max-w-[920px]"><p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#23786f]">Questions</p><h2 className="font-display mt-4 text-4xl tracking-[-0.05em] sm:text-5xl">Before you request a visit.</h2><div className="mt-8 border-t border-[#173137]/12">{service.faqs.map((faq) => <details key={faq.question} className="border-b border-[#173137]/12 py-5"><summary className="cursor-pointer text-base font-extrabold">{faq.question}</summary><p className="mt-3 max-w-[760px] text-sm leading-7 text-[#173137]/72">{faq.answer}</p></details>)}</div><div className="mt-10 rounded-[26px] bg-[#f1c9ad] p-7 sm:p-10"><h2 className="font-display text-3xl tracking-[-0.05em] sm:text-4xl">Ready to plan your clean?</h2><p className="mt-3 max-w-[620px] text-sm leading-6 text-[#173137]/72">Share your UK postcode, preferred date and home details. BrightNest will review the request before confirming availability.</p><Link href="/#booking" className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#173137] px-5 py-3 text-sm font-extrabold text-[#f8f6ef]">Start your request <ArrowRight className="h-4 w-4" /></Link></div></div></section></main></div>;
}

function ServicesIndex() {
  return <div className="min-h-screen bg-[#f8f6ef] text-[#173137]">
    <ServiceMetadata />
    <ServiceHeader />
    <main className="px-5 py-12 sm:py-20 lg:px-10">
      <div className="mx-auto max-w-[1220px]">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#23786f]">BrightNest Cleaning UK</p>
        <h1 className="font-display mt-5 max-w-[760px] text-5xl leading-[0.94] tracking-[-0.06em] sm:text-7xl">Cleaning services across the UK.</h1>
        <p className="mt-6 max-w-[650px] text-base leading-7 text-[#173137]/72 sm:text-lg">Explore thoughtful domestic and specialist cleaning services. Every request includes a postcode, preferred timing and scope review before confirmation.</p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => <Link key={service.slug} href={`/services/${service.slug}`} className="group rounded-[24px] border border-[#173137]/10 bg-white p-6 transition-transform duration-200 hover:-translate-y-1"><p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#23786f]">{service.eyebrow}</p><h2 className="mt-4 text-xl font-extrabold tracking-[-0.03em]">{service.title}</h2><p className="mt-3 text-sm leading-6 text-[#173137]/68">{service.description}</p><span className="mt-6 inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.12em] text-[#23786f]">Explore service <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" /></span></Link>)}
        </div>
      </div>
    </main>
  </div>;
}

export default function Services() {
  const [, params] = useRoute("/services/:slug");
  const service = params?.slug ? services.find((item) => item.slug === params.slug) : undefined;
  return service ? <ServicePage service={service} /> : <ServicesIndex />;
}
