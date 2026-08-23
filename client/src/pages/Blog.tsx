/*
 * BrightNest design reminder — Quiet British Home Editorial: warm ivory, BrightNest Mint,
 * editorial asymmetry, concise household guidance, and calm low-friction navigation.
 */
import { ArrowLeft, ArrowRight, CalendarDays, Check, CheckCircle2, Clock3, Copy, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useRoute } from "wouter";

type Article = {
  id: string;
  category: string;
  date: string;
  readTime: string;
  title: string;
  excerpt: string;
  image: string;
  imageSrcSet?: string;
  imageAlt: string;
  socialImage?: string;
  intro: string;
  sections: { heading: string; paragraphs: string[]; points?: string[] }[];
};

const articles: Article[] = [
  {
    id: "deep-cleaning-reset",
    category: "Deep cleaning",
    date: "06 Aug 2026",
    readTime: "5 min read",
    title: "The calm-home reset: where a deep clean makes the biggest difference",
    excerpt: "A practical room-by-room way to decide what needs attention first, without turning the whole weekend into a project.",
    image: "/blog/brightnest-blog-deep-cleaning.webp",
    imageAlt: "A calm, bright living room prepared for a deep clean",
    socialImage: "/blog/brightnest-blog-deep-cleaning.webp",
    intro: "A deep clean feels much more manageable when it follows the way your home is used. Start with the places that collect the most daily activity, then move towards the quieter corners.",
    sections: [
      { heading: "Start with the rooms that carry the week", paragraphs: ["Kitchens, bathrooms and entranceways usually create the strongest sense of freshness. Clear the surfaces first so the clean can reach the edges, handles and areas that are touched often."] , points: ["Clear worktops and open shelves.", "Work from high surfaces down to the floor.", "Finish with fresh cloths and a clean bin liner."]},
      { heading: "Give the overlooked details a turn", paragraphs: ["Skirting boards, light switches, door frames and the space behind small appliances make a quiet difference. You do not need to tackle every detail in one day; choose the few that will change how the room feels."]},
      { heading: "Keep the reset easy to repeat", paragraphs: ["Once the deeper work is complete, a short weekly rhythm is enough to protect the result. A considered clean is not about doing more. It is about putting attention in the right places."]},
    ],
  },
  {
    id: "gentler-products",
    category: "Home care",
    date: "29 Jul 2026",
    readTime: "4 min read",
    title: "A gentler cleaning cupboard, built around the home you actually use",
    excerpt: "How to choose a small, useful set of products and tools for everyday surfaces, kitchen details and fresh finishes.",
    image: "/blog/brightnest-blog-eco-products.webp",
    imageAlt: "A considered collection of gentle cleaning products and tools",
    socialImage: "/blog/brightnest-blog-eco-products.webp",
    intro: "A useful cleaning cupboard does not need to be crowded. A small set of reliable products, paired with the right cloths and brushes, can cover most everyday jobs.",
    sections: [
      { heading: "Choose a few dependable basics", paragraphs: ["Keep one gentle multi-surface cleaner, a bathroom cleaner, washing-up liquid and a suitable floor solution. Check labels carefully and follow the guidance for each surface."]},
      { heading: "Match the tool to the finish", paragraphs: ["Microfibre cloths are useful for many hard surfaces, while a soft brush helps around taps, grout and textured areas. Keep separate cloths for kitchens and bathrooms so the routine stays hygienic."] , points: ["Use a soft cloth on polished surfaces.", "Use a fresh cloth for food-preparation areas.", "Wash reusable cloths regularly and allow them to dry fully."]},
      { heading: "Less choice can make cleaning calmer", paragraphs: ["When every product has a clear purpose, it is easier to start and easier to put everything away. The best cupboard is the one that supports the routine you can actually keep."]},
    ],
  },
  {
    id: "rental-turnover",
    category: "Hosts & landlords",
    date: "18 Jul 2026",
    readTime: "6 min read",
    title: "A smoother changeover for guests, tenants and busy property teams",
    excerpt: "The details that help a rental feel ready again, from first impression to the small touches people notice on arrival.",
    image: "/blog/brightnest-blog-rental-turnover.webp",
    imageAlt: "A welcoming bedroom prepared for a guest or tenant changeover",
    socialImage: "/blog/brightnest-blog-rental-turnover.webp",
    intro: "A good changeover is a sequence, not a rush. The property should feel clear, comfortable and ready from the moment a guest or tenant opens the door.",
    sections: [
      { heading: "Begin with the first five minutes", paragraphs: ["Entryways, kitchen surfaces, bathrooms and visible floors set the first impression. Check these areas before moving deeper into bedrooms and storage spaces."]},
      { heading: "Use a repeatable room check", paragraphs: ["A short checklist keeps standards consistent between visits. Include linen, bins, mirrors, taps, high-touch handles and the small items that are easy to miss when time is tight."] , points: ["Air the property where practical.", "Reset supplies and presentation items.", "Photograph any maintenance concern before handover."]},
      { heading: "Leave time for the final walk-through", paragraphs: ["The last pass should be visual and practical: lights working, taps dry, windows secure and every room ready for its next use. That final pause protects the whole changeover."]},
    ],
  },
  {
    id: "winter-home-care",
    category: "Seasonal care",
    date: "08 Jul 2026",
    readTime: "4 min read",
    title: "The winter home edit: small cleaning habits that lighten the darker months",
    excerpt: "A gentle seasonal checklist for kitchens, soft furnishings and the corners that collect more dust when windows stay closed.",
    image: "/blog/brightnest-blog-winter-home.webp",
    imageAlt: "A light-filled home corner with seasonal greenery and fresh surfaces",
    socialImage: "/blog/brightnest-blog-winter-home.webp",
    intro: "Winter cleaning is less about a dramatic reset and more about keeping the home feeling breathable, warm and cared for while doors and windows stay closed.",
    sections: [
      { heading: "Refresh the soft layers", paragraphs: ["Shake rugs, wash throws according to their care labels and vacuum beneath furniture where dust settles. A little attention to fabrics can make a room feel lighter immediately."]},
      { heading: "Keep kitchens and bathrooms bright", paragraphs: ["Wipe condensation-prone areas, dry around taps and give cupboard handles a regular clean. These small habits help prevent a heavy, closed-in feeling."] , points: ["Ventilate bathrooms after use.", "Dry window ledges and sills.", "Empty bins before odours settle."]},
      { heading: "Make the routine seasonal, not endless", paragraphs: ["Choose one small area each week rather than waiting for a large job to build up. A calmer home often comes from a few well-timed details."]},
    ],
  },
  {
    id: "laundry-rhythm",
    category: "Everyday care",
    date: "30 Jun 2026",
    readTime: "4 min read",
    title: "A calmer laundry rhythm for busy homes",
    excerpt: "Small changes that make washing, drying and putting away feel less like a second job.",
    image: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663898260788/eUlkufpNEnCNbdBA.webp",
    imageSrcSet: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663898260788/FXxwgcfNfuaUXVhH.webp 480w, https://files.manuscdn.com/user_upload_by_module/session_file/310519663898260788/eUlkufpNEnCNbdBA.webp 960w",
    imageAlt: "Fresh white laundry arranged in a bright utility room",
    socialImage: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663898260788/eUlkufpNEnCNbdBA.webp",
    intro: "Laundry becomes easier to live with when it has a gentle rhythm. The aim is not to do everything at once, but to keep the next load obvious and manageable.",
    sections: [
      { heading: "Create one clear starting point", paragraphs: ["Keep one basket for everyday clothes and a separate place for towels or bedding. When sorting has a home, the routine starts with less decision-making."] },
      { heading: "Make drying work for the room", paragraphs: ["Leave space between items and choose the best-ventilated place available. A little more air around each piece helps the whole load feel fresher."] , points: ["Shake items before hanging.", "Keep damp laundry off the floor.", "Fold dry pieces before starting another load."]},
      { heading: "Put away in small passes", paragraphs: ["A five-minute fold at the end of the day is often kinder than a large pile at the weekend. Keep the standard simple and repeatable."]},
    ],
  },
  {
    id: "bathroom-reset",
    category: "Home care",
    date: "22 Jun 2026",
    readTime: "5 min read",
    title: "The small bathroom reset that changes the whole morning",
    excerpt: "A practical order for keeping taps, mirrors, surfaces and soft details feeling fresh between deeper cleans.",
    image: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663898260788/fLadJyWmOFXVfyKQ.webp",
    imageSrcSet: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663898260788/LmXVDpgRtdZDmjdn.webp 480w, https://files.manuscdn.com/user_upload_by_module/session_file/310519663898260788/fLadJyWmOFXVfyKQ.webp 960w",
    imageAlt: "A calm bathroom with a clean basin, soft towels and natural light",
    socialImage: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663898260788/fLadJyWmOFXVfyKQ.webp",
    intro: "Bathrooms feel calmer when the routine follows the way moisture moves through the room: clear the surfaces, dry the wet areas, then finish with the details you see first.",
    sections: [
      { heading: "Clear before you spray", paragraphs: ["Move bottles and small items aside so the basin, ledges and bath edge can be cleaned in one continuous pass. Put back only what you use every day."] },
      { heading: "Dry the places that stay damp", paragraphs: ["Give taps, shower screens and the area around the basin a quick dry after cleaning. This simple finish keeps the room looking brighter for longer."] , points: ["Use a separate cloth for the toilet area.", "Leave the room ventilated after a shower.", "Wash bathmats regularly and dry them fully."]},
      { heading: "Finish at eye level", paragraphs: ["A clear mirror, clean handles and a fresh hand towel create the strongest sense of order. These are small details, but they are the ones guests notice."]},
    ],
  },
  {
    id: "office-ready",
    category: "Workspaces",
    date: "14 Jun 2026",
    readTime: "4 min read",
    title: "A small-office reset for clearer working days",
    excerpt: "How to keep a home office or compact workplace ready without making cleaning another task on the list.",
    image: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663898260788/QQKpIAUeTDrMpYZo.webp",
    imageSrcSet: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663898260788/ZYZKesmBeobqbgxD.webp 480w, https://files.manuscdn.com/user_upload_by_module/session_file/310519663898260788/QQKpIAUeTDrMpYZo.webp 960w",
    imageAlt: "A tidy home office desk with a calm, organised workspace",
    socialImage: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663898260788/QQKpIAUeTDrMpYZo.webp",
    intro: "A workspace works better when the visual noise is reduced. A short reset at the end of the day protects the next morning without taking over the evening.",
    sections: [
      { heading: "Clear the working surface", paragraphs: ["Return notebooks, chargers and cups to one defined place. Wipe the desk once it is clear, paying attention to the edges where dust settles."] },
      { heading: "Do the high-touch details", paragraphs: ["Keyboard areas, handles, switches and shared equipment deserve regular attention. Use a product suitable for the material and keep moisture away from electronics."] , points: ["Keep cables gathered and off the floor.", "Empty the small bin before it overfills.", "Dust screens with a dry, soft cloth."]},
      { heading: "Leave a visual cue for tomorrow", paragraphs: ["A clear chair, an open notebook or one tidy tray can signal that the room is ready. The best reset ends with less to decide in the morning."]},
    ],
  },
  {
    id: "brighter-windows",
    category: "Seasonal care",
    date: "06 Jun 2026",
    readTime: "5 min read",
    title: "Clearer windows, brighter rooms: a simple seasonal edit",
    excerpt: "A considered window-care routine for homes that want more daylight without a complicated checklist.",
    image: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663898260788/zlrpADIKGBzhTxMn.webp",
    imageSrcSet: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663898260788/LGINpxnrDsqSWsPc.webp 480w, https://files.manuscdn.com/user_upload_by_module/session_file/310519663898260788/zlrpADIKGBzhTxMn.webp 960w",
    imageAlt: "A bright sitting room with clean windows and soft natural light",
    socialImage: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663898260788/zlrpADIKGBzhTxMn.webp",
    intro: "Clean windows change the feeling of a room before anything else does. A simple seasonal pass focuses on the glass, frames and ledges that collect dust together.",
    sections: [
      { heading: "Choose the right moment", paragraphs: ["Work on a bright but not fiercely sunny day where possible. Direct heat can dry solution too quickly and leave more marks behind."] },
      { heading: "Treat the frame as part of the window", paragraphs: ["Brush or vacuum loose dust from frames and sills first. Then clean the glass with a suitable cloth and finish with clean, dry edges."] , points: ["Start with the least dirty pane.", "Use a fresh cloth for the final polish.", "Check corners and handles before finishing."]},
      { heading: "Keep the light coming in", paragraphs: ["A seasonal clean is easier to maintain when ledges stay clear and curtains are aired. Small, regular attention keeps the room feeling open."]},
    ],
  },
];

function ArticleMetadata({ article }: { article?: Article }) {
  useEffect(() => {
    const title = article ? `${article.title} | BrightNest Cleaning UK` : "BrightNest Notes | Cleaning advice for a lighter week";
    const description = article?.excerpt ?? "Practical cleaning notes for homes, hosts and busy households across Birmingham from BrightNest Cleaning UK.";
    const canonical = `${window.location.origin}${article ? `/blog/${article.id}` : "/blog"}`;
    const image = new URL(article?.socialImage ?? "/blog/brightnest-blog-winter-home.webp", window.location.origin).href;
    document.title = title;
    const values: Record<string, string> = { description, "og:title": title, "og:description": description, "og:type": article ? "article" : "website", "og:url": canonical, "og:image": image, "twitter:card": "summary_large_image", "twitter:title": title, "twitter:description": description, "twitter:image": image };
    Object.entries(values).forEach(([name, content]) => {
      const selector = name.startsWith("og:") ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let tag = document.head.querySelector<HTMLMetaElement>(selector);
      if (!tag) { tag = document.createElement("meta"); name.startsWith("og:") ? tag.setAttribute("property", name) : tag.setAttribute("name", name); document.head.appendChild(tag); }
      tag.setAttribute("content", content);
    });
    let canonicalTag = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonicalTag) { canonicalTag = document.createElement("link"); canonicalTag.rel = "canonical"; document.head.appendChild(canonicalTag); }
    canonicalTag.href = canonical;
    return () => { document.title = "BrightNest Cleaning UK"; };
  }, [article]);
  return null;
}

function ShareArticle({ article }: { article: Article }) {
  const [copied, setCopied] = useState(false);
  const url = typeof window === "undefined" ? "" : window.location.href;
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(article.title);
  const copyLink = async () => { try { await navigator.clipboard.writeText(url); setCopied(true); window.setTimeout(() => setCopied(false), 1800); } catch { setCopied(false); } };
  return <section className="mt-14 border-t border-[#173137]/12 pt-8 sm:mt-20"><div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#23786f]">Pass it on</p><h2 className="font-display mt-2 text-[30px] leading-none tracking-[-0.04em]">Share this note</h2></div><div className="flex flex-wrap gap-2" aria-label="Share this article"><a href={`https://wa.me/?text=${encodedTitle}%20${encodedUrl}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-[#173137]/15 px-4 py-2.5 text-xs font-extrabold text-[#173137] transition-colors hover:border-[#2f9f91] hover:text-[#23786f]">WhatsApp</a><a href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-[#173137]/15 px-4 py-2.5 text-xs font-extrabold text-[#173137] transition-colors hover:border-[#2f9f91] hover:text-[#23786f]">Facebook</a><a href={`https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-[#173137]/15 px-4 py-2.5 text-xs font-extrabold text-[#173137] transition-colors hover:border-[#2f9f91] hover:text-[#23786f]">X</a><button type="button" onClick={copyLink} className="inline-flex items-center gap-2 rounded-full bg-[#173137] px-4 py-2.5 text-xs font-extrabold text-[#f8f6ef] transition-colors hover:bg-[#2f9f91]" aria-label="Copy article link">{copied ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}{copied ? "Copied" : "Copy link"}</button></div></div></section>;
}

function Header({ mobileOpen, setMobileOpen }: { mobileOpen: boolean; setMobileOpen: (value: boolean) => void }) {
  const navigation = [
    ["Home", "/"], ["Services", "/#services"], ["How it works", "/#how-it-works"],
    ["Why BrightNest", "/#difference"], ["Blog", "/blog"], ["FAQs", "/#faqs"],
  ];
  return <>
    <div className="bg-[#173137] px-4 py-2.5 text-center text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#f8f6ef] sm:text-xs">Thoughtful domestic & specialist cleaning across Birmingham & surrounding areas</div>
    <header className="sticky top-0 z-40 px-3 pt-3 sm:px-5 lg:px-8">
      <div className="mx-auto flex min-h-[72px] max-w-[1440px] items-center justify-between gap-5 rounded-full border border-[#173137]/12 bg-[#fffdf7]/95 px-4 shadow-[0_10px_30px_rgba(23,49,55,0.08)] backdrop-blur-xl sm:min-h-[76px] sm:px-5 lg:px-7">
        <Link href="/" className="group flex shrink-0 items-center" aria-label="BrightNest Cleaning UK home">
          <img src="/manus-storage/brightnest-original-logo_bd6c11b5.png" alt="BrightNest Cleaning UK logo" className="h-[62px] w-[166px] origin-left scale-[1.12] object-contain object-left transition-transform duration-200 group-hover:scale-[1.16] group-active:scale-95 sm:h-[68px] sm:w-[184px]" />
        </Link>
        <nav className="hidden items-center gap-5 lg:flex xl:gap-7" aria-label="Primary navigation">
          {navigation.map(([label, href]) => label === "Blog" ? <Link key={href} href={href} className="strict-nav-link strict-nav-link-active" aria-current="page">{label}</Link> : href.startsWith("/#") ? <a key={href} href={href} className="strict-nav-link">{label}</a> : <Link key={href} href={href} className="strict-nav-link">{label}</Link>)}
        </nav>
        <div className="hidden items-center gap-3 lg:flex"><Link href="/dashboard" className="text-sm font-bold text-[#173137]/78 transition-colors hover:text-[#23786f]">My bookings</Link><Link href="/#booking" className="btn-primary">Book a clean <ArrowRight className="h-4 w-4" /></Link></div>
        <button className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-[#173137]/15 text-[#173137] lg:hidden" onClick={() => setMobileOpen(!mobileOpen)} aria-label={mobileOpen ? "Close navigation" : "Open navigation"} aria-expanded={mobileOpen} aria-controls="blog-mobile-navigation">{mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button>
      </div>
      {mobileOpen && <div id="blog-mobile-navigation" className="border-t border-[#173137]/10 bg-[#f8f6ef] px-5 py-4 shadow-xl lg:hidden"><nav className="flex flex-col" aria-label="Mobile navigation">{navigation.map(([label, href]) => <Link key={href} href={href} onClick={() => setMobileOpen(false)} className={`flex items-center justify-between border-b border-[#173137]/10 py-4 text-left text-base font-bold ${label === "Blog" ? "text-[#23786f]" : ""}`} aria-current={label === "Blog" ? "page" : undefined}>{label}<ArrowRight className="h-4 w-4 text-[#23786f]" /></Link>)}<Link href="/dashboard" onClick={() => setMobileOpen(false)} className="flex items-center justify-between border-b border-[#173137]/10 py-4 text-left text-base font-bold">My bookings <ArrowRight className="h-4 w-4 text-[#23786f]" /></Link><Link href="/#booking" onClick={() => setMobileOpen(false)} className="btn-primary mt-4 w-full justify-center">Book a clean <ArrowRight className="h-4 w-4" /></Link></nav></div>}
    </header>
  </>;
}

function Footer() {
  return <footer className="bg-[#173137] px-5 pb-7 pt-10 text-[#f8f6ef] sm:pt-14 lg:px-10 lg:pt-18"><div className="mx-auto grid max-w-[1440px] gap-8 border-b border-white/15 pb-9 sm:gap-10 sm:pb-12 md:grid-cols-[1.25fr_0.75fr_0.75fr]"><div><img src="/manus-storage/brightnest-original-logo_bd6c11b5.png" alt="BrightNest Cleaning UK logo" className="h-[100px] w-[218px] origin-left scale-[1.08] object-contain object-left" /><p className="mt-6 max-w-[360px] text-sm leading-7 text-white/75">Thoughtful domestic and specialist cleaning across Birmingham and surrounding areas.</p></div><div><p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#9ee0d2]">Explore</p><div className="mt-5 flex flex-col gap-3 text-sm font-bold text-white/70"><Link href="/">Home</Link><a href="/#services">Services</a><a href="/#how-it-works">How it works</a><Link href="/blog" className="text-[#9ee0d2]">Blog</Link><a href="/#faqs">FAQs</a></div></div><div><p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#9ee0d2]">Book</p><p className="mt-5 text-sm leading-7 text-white/75">Need a tailored home or specialist cleaning request?</p><Link href="/#booking" className="mt-4 inline-flex items-center gap-2 text-sm font-extrabold text-white underline decoration-[#9ee0d2] decoration-2 underline-offset-4">Start your request <ArrowRight className="h-4 w-4" /></Link></div></div><div className="mx-auto flex max-w-[1440px] flex-col gap-3 pt-6 text-[11px] font-bold text-white/70 sm:flex-row sm:items-center sm:justify-between"><span>© {new Date().getFullYear()} BrightNest Cleaning UK. All rights reserved.</span><div className="flex flex-wrap items-center gap-x-3 gap-y-1"><Link href="/privacy-policy">Privacy Policy</Link><span aria-hidden="true">·</span><Link href="/terms-of-service">Terms of Service</Link><span aria-hidden="true">·</span><Link href="/dashboard">My bookings</Link></div></div></footer>;
}

function BlogIndex() {
  return <main><section className="px-5 pb-12 pt-6 sm:pb-18 sm:pt-8 lg:px-10 lg:pb-24 lg:pt-10"><div className="mx-auto grid max-w-[1440px] overflow-hidden rounded-[28px] border border-[#173137]/10 bg-[#e7f0e9] lg:grid-cols-[0.83fr_1.17fr] lg:rounded-[42px]"><div className="flex min-h-[420px] flex-col justify-between p-7 sm:p-10 lg:min-h-[530px] lg:p-14 xl:p-16"><div className="flex items-center gap-3 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#23786f] sm:text-xs"><span className="nestline" aria-hidden="true" /><span>BrightNest notes</span></div><div className="max-w-[570px]"><p className="eyebrow">The home journal</p><h1 className="font-display mt-5 text-[52px] leading-[0.92] tracking-[-0.065em] sm:text-[68px] xl:text-[82px]">Cleaning advice for a lighter week.</h1><p className="mt-6 max-w-[470px] text-base leading-7 text-[#173137]/78 sm:text-lg">Practical notes for homes, hosts and busy households across Birmingham — written to make the next clean feel easier to plan.</p><Link href="/#booking" className="btn-primary mt-8">Plan your clean <ArrowRight className="h-4 w-4" /></Link></div></div><div className="relative min-h-[300px] overflow-hidden bg-[#c5dfd5] lg:min-h-full"><img src="/blog/brightnest-blog-winter-home.webp" alt="A calm, clean kitchen corner with natural daylight" className="absolute inset-0 h-full w-full object-cover" /><div className="absolute inset-0 bg-gradient-to-r from-[#173137]/15 via-transparent to-transparent" /><div className="absolute bottom-5 left-5 max-w-[250px] rounded-[18px] border border-white/40 bg-[#f8f6ef]/88 p-4 backdrop-blur-sm sm:bottom-8 sm:left-8"><p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#23786f]">A considered approach</p><p className="mt-2 text-sm font-bold leading-5 text-[#173137]">Useful detail, without the overwhelm.</p></div></div></div></section><section className="px-5 pb-16 sm:pb-24 lg:px-10 lg:pb-32"><div className="mx-auto max-w-[1440px]"><div className="flex flex-col gap-5 border-t border-[#173137]/15 pt-6 sm:flex-row sm:items-end sm:justify-between"><div><p className="eyebrow">From the journal</p><h2 className="font-display mt-4 max-w-[620px] text-[42px] leading-[0.98] tracking-[-0.055em] sm:text-[56px]">Small notes. Noticeable difference.</h2></div><p className="max-w-[340px] text-sm leading-6 text-[#173137]/78 sm:text-right">Eight concise reads for the everyday rhythm of keeping a home, guest space or workplace feeling ready.</p></div><div className="mt-10 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:mt-14 lg:grid-cols-4">{articles.map((article) => <article key={article.id} className="group"><Link href={`/blog/${article.id}`} className="block rounded-[22px] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#2f9f91]/25"><div className="relative aspect-[1.12] overflow-hidden rounded-[22px] bg-[#e7f0e9]"><img src={article.image} srcSet={article.imageSrcSet} sizes="(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 23vw" alt={article.imageAlt} loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.035]" /><div className="absolute left-4 top-4 rounded-full bg-[#f8f6ef]/90 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#173137]">{article.category}</div></div><div className="mt-5 flex items-center gap-3 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#23786f]"><span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{article.date}</span><span aria-hidden="true" className="text-[#173137]/25">·</span><span className="inline-flex items-center gap-1 text-[#173137]/72"><Clock3 className="h-3.5 w-3.5" />{article.readTime}</span></div><h3 className="mt-3 text-xl font-extrabold leading-[1.08] tracking-[-0.035em] text-[#173137]">{article.title}</h3><p className="mt-3 text-sm leading-6 text-[#173137]/78">{article.excerpt}</p><span className="mt-4 inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.12em] text-[#23786f]">Read article <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" /></span></Link></article>)}</div></div></section><section className="px-5 pb-12 sm:pb-16 lg:px-10 lg:pb-20"><div className="mx-auto grid max-w-[1440px] gap-6 rounded-[26px] bg-[#173137] p-7 text-[#f8f6ef] sm:p-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-end lg:rounded-[38px] lg:p-14"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#9ee0d2]">Need a hand with the detail?</p><h2 className="font-display mt-4 max-w-[650px] text-[42px] leading-[0.98] tracking-[-0.055em] sm:text-[56px]">Turn a good intention into a calmer home.</h2></div><div className="lg:justify-self-end"><p className="max-w-[360px] text-sm leading-6 text-white/72">Tell us what needs attention, where you are based and the timing that suits you. We’ll review the details before confirming a visit.</p><Link href="/#booking" className="mt-6 inline-flex items-center gap-2 text-sm font-extrabold text-white underline decoration-[#9ee0d2] decoration-2 underline-offset-4">Start your request <ArrowRight className="h-4 w-4" /></Link></div></div></section></main>;
}

function ArticleView({ article }: { article: Article }) {
  return <main><section className="px-5 pb-10 pt-6 sm:pb-16 sm:pt-8 lg:px-10 lg:pb-20 lg:pt-10"><div className="mx-auto grid max-w-[1180px] overflow-hidden rounded-[28px] border border-[#173137]/10 bg-white lg:grid-cols-[0.9fr_1.1fr] lg:rounded-[38px]"><div className="flex flex-col justify-between p-7 sm:p-10 lg:p-14"><Link href="/blog" className="inline-flex w-fit items-center gap-2 text-xs font-extrabold uppercase tracking-[0.14em] text-[#23786f]"><ArrowLeft className="h-4 w-4" />Back to journal</Link><div className="mt-16"><p className="eyebrow">{article.category}</p><h1 className="font-display mt-5 text-[48px] leading-[0.94] tracking-[-0.06em] sm:text-[64px]">{article.title}</h1><div className="mt-7 flex flex-wrap items-center gap-3 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#23786f]"><span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{article.date}</span><span className="text-[#173137]/25">·</span><span className="inline-flex items-center gap-1 text-[#173137]/72"><Clock3 className="h-3.5 w-3.5" />{article.readTime}</span></div></div></div><div className="relative min-h-[360px] bg-[#e7f0e9] lg:min-h-full"><img src={article.image} srcSet={article.imageSrcSet} sizes="(max-width: 1024px) 100vw, 55vw" alt={article.imageAlt} loading="eager" fetchPriority="high" decoding="async" className="absolute inset-0 h-full w-full object-cover" /></div></div></section><article className="px-5 pb-16 sm:pb-24 lg:px-10 lg:pb-32"><div className="mx-auto max-w-[820px]"><p className="font-display text-[30px] leading-[1.12] tracking-[-0.04em] text-[#173137] sm:text-[38px]">{article.intro}</p><div className="mt-12 space-y-12 border-t border-[#173137]/12 pt-10 sm:mt-16 sm:space-y-14 sm:pt-12">{article.sections.map((section) => <section key={section.heading}><h2 className="font-display text-[32px] leading-none tracking-[-0.045em] sm:text-[42px]">{section.heading}</h2><div className="mt-5 space-y-4 text-base leading-8 text-[#173137]/78 sm:text-lg">{section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>{section.points && <ul className="mt-6 grid gap-3 rounded-[22px] bg-[#e7f0e9] p-5 text-sm font-bold leading-6 text-[#173137] sm:grid-cols-3 sm:p-6">{section.points.map((point) => <li key={point} className="flex gap-2"><Check className="mt-1 h-4 w-4 shrink-0 text-[#23786f]" />{point}</li>)}</ul>}</section>)}</div><div className="mt-14 rounded-[26px] bg-[#173137] p-7 text-[#f8f6ef] sm:mt-20 sm:p-10"><p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#9ee0d2]">Make the next clean feel easier</p><h2 className="font-display mt-4 max-w-[570px] text-[36px] leading-[0.98] tracking-[-0.05em] sm:text-[48px]">Tell us what your home needs.</h2><Link href="/#booking" className="btn-primary mt-7 bg-[#9ee0d2] text-[#173137] hover:bg-white">Plan your clean <ArrowRight className="h-4 w-4" /></Link></div></div><ShareArticle article={article} /></article></main>;
}

export default function Blog() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [, params] = useRoute("/blog/:id");
  const article = params?.id ? articles.find((item) => item.id === params.id) : undefined;
  return <div className="min-h-screen overflow-x-clip bg-[#f8f6ef] text-[#173137]"><ArticleMetadata article={article} /><Header mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />{article ? <ArticleView article={article} /> : <BlogIndex />}<Footer /></div>;
}
