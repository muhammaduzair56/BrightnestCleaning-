/*
 * BrightNest design reminder — Quiet British Home Editorial: warm ivory, BrightNest Mint,
 * editorial asymmetry, helpful household guidance, and calm low-friction navigation.
 */
import { ArrowRight, CalendarDays, ChevronLeft, Clock3, Menu, ShieldCheck, X } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

const articles = [
  {
    id: "deep-cleaning-reset",
    category: "Deep cleaning",
    date: "06 Aug 2026",
    readTime: "5 min read",
    title: "The calm-home reset: where a deep clean makes the biggest difference",
    excerpt: "A practical room-by-room way to decide what needs attention first, without turning the whole weekend into a project.",
    image: "/manus-storage/brightnest-blog-deep-cleaning_9ab3c67b.jpg",
  },
  {
    id: "gentler-products",
    category: "Home care",
    date: "29 Jul 2026",
    readTime: "4 min read",
    title: "A gentler cleaning cupboard, built around the home you actually use",
    excerpt: "How to choose a small, useful set of products and tools for everyday surfaces, kitchen details and fresh finishes.",
    image: "/manus-storage/brightnest-blog-eco-products_6a30e058.jpg",
  },
  {
    id: "rental-turnover",
    category: "Hosts & landlords",
    date: "18 Jul 2026",
    readTime: "6 min read",
    title: "A smoother changeover for guests, tenants and busy property teams",
    excerpt: "The details that help a rental feel ready again, from first impression to the small touches people notice on arrival.",
    image: "/manus-storage/brightnest-blog-rental-turnover_7ae22bec.jpg",
  },
  {
    id: "winter-home-care",
    category: "Seasonal care",
    date: "08 Jul 2026",
    readTime: "4 min read",
    title: "The winter home edit: small cleaning habits that lighten the darker months",
    excerpt: "A gentle seasonal checklist for kitchens, soft furnishings and the corners that collect more dust when windows stay closed.",
    image: "/manus-storage/brightnest-blog-winter-home_def780f9.jpg",
  },
];

export default function Blog() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f8f6ef] text-[#173137]">
      <div className="bg-[#173137] px-4 py-2.5 text-center text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#f8f6ef] sm:text-xs">
        Thoughtful domestic & specialist cleaning across Birmingham & surrounding areas
      </div>

      <header className="sticky top-0 z-40 border-b border-[#173137]/10 bg-[#f8f6ef]/95 backdrop-blur-xl">
        <div className="mx-auto flex min-h-[76px] max-w-[1440px] items-center justify-between gap-5 px-5 lg:px-10">
          <Link href="/" className="group flex shrink-0 items-center" aria-label="BrightNest Cleaning UK home">
            <img
              src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663898260788/nGxiaCTVOHaPBQzw.png"
              alt="BrightNest Cleaning UK logo"
              className="h-[62px] w-[166px] origin-left scale-[1.12] object-contain object-left transition-transform duration-200 group-hover:scale-[1.16] group-active:scale-95 sm:h-[68px] sm:w-[184px]"
            />
          </Link>

          <nav className="hidden items-center gap-5 lg:flex xl:gap-7" aria-label="Primary navigation">
            <Link href="/" className="strict-nav-link">Home</Link>
            <a href="/#services" className="strict-nav-link">Services</a>
            <a href="/#how-it-works" className="strict-nav-link">How it works</a>
            <a href="/#difference" className="strict-nav-link">Why BrightNest</a>
            <Link href="/blog" className="strict-nav-link strict-nav-link-active" aria-current="page">Blog</Link>
            <a href="/#faqs" className="strict-nav-link">FAQs</a>
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <Link href="/dashboard" className="text-sm font-bold text-[#173137]/70 transition-colors hover:text-[#2f9f91]">My bookings</Link>
            <Link href="/#booking" className="btn-primary">Book a clean <ArrowRight className="h-4 w-4" /></Link>
          </div>

          <button
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-[#173137]/15 text-[#173137] lg:hidden"
            onClick={() => setMobileOpen((open) => !open)}
            aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={mobileOpen}
            aria-controls="blog-mobile-navigation"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {mobileOpen && (
          <div id="blog-mobile-navigation" className="border-t border-[#173137]/10 bg-[#f8f6ef] px-5 py-4 shadow-xl lg:hidden">
            <nav className="flex flex-col" aria-label="Mobile navigation">
              {[
                ["Home", "/"],
                ["Services", "/#services"],
                ["How it works", "/#how-it-works"],
                ["Why BrightNest", "/#difference"],
                ["Blog", "/blog"],
                ["FAQs", "/#faqs"],
              ].map(([label, href]) => (
                <Link key={href} href={href} onClick={() => setMobileOpen(false)} className={`flex items-center justify-between border-b border-[#173137]/10 py-4 text-left text-base font-bold ${label === "Blog" ? "text-[#2f9f91]" : ""}`} aria-current={label === "Blog" ? "page" : undefined}>
                  {label} <ArrowRight className="h-4 w-4 text-[#2f9f91]" />
                </Link>
              ))}
              <Link href="/dashboard" onClick={() => setMobileOpen(false)} className="flex items-center justify-between border-b border-[#173137]/10 py-4 text-left text-base font-bold">My bookings <ArrowRight className="h-4 w-4 text-[#2f9f91]" /></Link>
              <Link href="/#booking" onClick={() => setMobileOpen(false)} className="btn-primary mt-4 w-full justify-center">Book a clean <ArrowRight className="h-4 w-4" /></Link>
            </nav>
          </div>
        )}
      </header>

      <main>
        <section className="px-5 pb-12 pt-6 sm:pb-18 sm:pt-8 lg:px-10 lg:pb-24 lg:pt-10">
          <div className="mx-auto grid max-w-[1440px] overflow-hidden rounded-[28px] border border-[#173137]/10 bg-[#e7f0e9] lg:grid-cols-[0.83fr_1.17fr] lg:rounded-[42px]">
            <div className="flex min-h-[420px] flex-col justify-between p-7 sm:p-10 lg:min-h-[530px] lg:p-14 xl:p-16">
              <div className="flex items-center gap-3 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#2f9f91] sm:text-xs">
                <span className="nestline" aria-hidden="true" />
                <span>BrightNest notes</span>
              </div>
              <div className="max-w-[570px]">
                <p className="eyebrow">The home journal</p>
                <h1 className="font-display mt-5 text-[52px] leading-[0.92] tracking-[-0.065em] sm:text-[68px] xl:text-[82px]">Cleaning advice for a lighter week.</h1>
                <p className="mt-6 max-w-[470px] text-base leading-7 text-[#173137]/70 sm:text-lg">Practical notes for homes, hosts and busy households across Birmingham — written to make the next clean feel easier to plan.</p>
                <Link href="/#booking" className="btn-primary mt-8">Plan your clean <ArrowRight className="h-4 w-4" /></Link>
              </div>
            </div>
            <div className="relative min-h-[300px] overflow-hidden bg-[#c5dfd5] lg:min-h-full">
              <img src="/manus-storage/brightnest-blog-winter-home_def780f9.jpg" alt="A calm, clean kitchen corner with natural daylight" className="absolute inset-0 h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#173137]/15 via-transparent to-transparent" />
              <div className="absolute bottom-5 left-5 max-w-[250px] rounded-[18px] border border-white/40 bg-[#f8f6ef]/88 p-4 backdrop-blur-sm sm:bottom-8 sm:left-8">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#2f9f91]">A considered approach</p>
                <p className="mt-2 text-sm font-bold leading-5 text-[#173137]">Useful detail, without the overwhelm.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="px-5 pb-16 sm:pb-24 lg:px-10 lg:pb-32">
          <div className="mx-auto max-w-[1440px]">
            <div className="flex flex-col gap-5 border-t border-[#173137]/15 pt-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="eyebrow">From the journal</p>
                <h2 className="font-display mt-4 max-w-[620px] text-[42px] leading-[0.98] tracking-[-0.055em] sm:text-[56px]">Small notes. Noticeable difference.</h2>
              </div>
              <p className="max-w-[340px] text-sm leading-6 text-[#173137]/65 sm:text-right">Ideas for the everyday rhythm of keeping a home, guest space or workplace feeling ready.</p>
            </div>

            <div className="mt-10 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:mt-14 lg:grid-cols-4">
              {articles.map((article) => (
                <article key={article.id} id={article.id} className="group scroll-mt-28">
                  <div className="relative aspect-[1.12] overflow-hidden rounded-[22px] bg-[#e7f0e9]">
                    <img src={article.image} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.035]" />
                    <div className="absolute left-4 top-4 rounded-full bg-[#f8f6ef]/90 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#173137]">{article.category}</div>
                  </div>
                  <div className="mt-5 flex items-center gap-3 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#2f9f91]">
                    <span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{article.date}</span>
                    <span aria-hidden="true" className="text-[#173137]/25">·</span>
                    <span className="inline-flex items-center gap-1 text-[#173137]/50"><Clock3 className="h-3.5 w-3.5" />{article.readTime}</span>
                  </div>
                  <h3 className="mt-3 text-xl font-extrabold leading-[1.08] tracking-[-0.035em] text-[#173137]">{article.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-[#173137]/65">{article.excerpt}</p>
                  <a href={`#${article.id}`} className="mt-4 inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.12em] text-[#2f9f91] underline decoration-[#2f9f91]/35 underline-offset-4">Read note <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" /></a>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="px-5 pb-12 sm:pb-16 lg:px-10 lg:pb-20">
          <div className="mx-auto grid max-w-[1440px] gap-6 rounded-[26px] bg-[#173137] p-7 text-[#f8f6ef] sm:p-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-end lg:rounded-[38px] lg:p-14">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#9ee0d2]">Need a hand with the detail?</p>
              <h2 className="font-display mt-4 max-w-[650px] text-[42px] leading-[0.98] tracking-[-0.055em] sm:text-[56px]">Turn a good intention into a calmer home.</h2>
            </div>
            <div className="lg:justify-self-end">
              <p className="max-w-[360px] text-sm leading-6 text-white/62">Tell us what needs attention, where you are based and the timing that suits you. We’ll review the details before confirming a visit.</p>
              <Link href="/#booking" className="mt-6 inline-flex items-center gap-2 text-sm font-extrabold text-white underline decoration-[#9ee0d2] decoration-2 underline-offset-4">Start your request <ArrowRight className="h-4 w-4" /></Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-[#173137] px-5 pb-7 pt-10 text-[#f8f6ef] sm:pt-14 lg:px-10 lg:pt-18">
        <div className="mx-auto grid max-w-[1440px] gap-8 border-b border-white/15 pb-9 sm:gap-10 sm:pb-12 md:grid-cols-[1.25fr_0.75fr_0.75fr]">
          <div>
            <img src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663898260788/nGxiaCTVOHaPBQzw.png" alt="BrightNest Cleaning UK logo" className="h-[100px] w-[218px] origin-left scale-[1.08] object-contain object-left" />
            <p className="mt-6 max-w-[360px] text-sm leading-7 text-white/60">Thoughtful domestic and specialist cleaning across Birmingham and surrounding areas.</p>
          </div>
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#9ee0d2]">Explore</p>
            <div className="mt-5 flex flex-col gap-3 text-sm font-bold text-white/70">
              <Link href="/">Home</Link><a href="/#services">Services</a><a href="/#how-it-works">How it works</a><Link href="/blog" className="text-[#9ee0d2]">Blog</Link><a href="/#faqs">FAQs</a>
            </div>
          </div>
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#9ee0d2]">Book</p>
            <p className="mt-5 text-sm leading-7 text-white/60">Need a tailored home or specialist cleaning request?</p>
            <Link href="/#booking" className="mt-4 inline-flex items-center gap-2 text-sm font-extrabold text-white underline decoration-[#9ee0d2] decoration-2 underline-offset-4">Start your request <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </div>
        <div className="mx-auto flex max-w-[1440px] flex-col gap-3 pt-6 text-[11px] font-bold text-white/40 sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} BrightNest Cleaning UK. All rights reserved.</span>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1"><Link href="/privacy-policy">Privacy Policy</Link><span aria-hidden="true">·</span><Link href="/terms-of-service">Terms of Service</Link><span aria-hidden="true">·</span><Link href="/dashboard">My bookings</Link></div>
        </div>
      </footer>
    </div>
  );
}
