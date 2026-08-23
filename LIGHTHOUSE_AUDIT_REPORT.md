# BrightNest Cleaning UK — Production Lighthouse Audit

**Audit target:** `https://brightnestcleaning.vercel.app/` and `https://brightnestcleaning.vercel.app/blog`  
**Audit tool:** Lighthouse 12.8.2  
**Audit date:** 23 August 2026  
**Modes:** Mobile and Desktop presets  
**Scope:** Performance, Accessibility, Best Practices, SEO, Core Web Vitals, network payloads, and image delivery.

## Executive summary

The live site is technically healthy and SEO-ready, but the main opportunity is **mobile performance**, especially image delivery. SEO scored **100/100** on both homepage and blog. Desktop performance scored **91/100** on both routes, while mobile scored **63/100** on the homepage and **71/100** on the blog. The primary cause is oversized image payloads: the homepage transferred approximately **5.7 MB**, while the blog transferred approximately **20.6 MB** in the tested run.

> The most important next improvement is to create responsive WebP/AVIF derivatives, serve smaller mobile sizes, and lazy-load below-the-fold article images. This should improve mobile LCP and reduce data usage without changing the visual design.

## Scorecard

| Page | Mode | Performance | Accessibility | Best Practices | SEO |
| --- | --- | ---: | ---: | ---: | ---: |
| Homepage | Mobile | 63 | 91 | 82 | 100 |
| Homepage | Desktop | 91 | 91 | 81 | 100 |
| Blog index | Mobile | 71 | 88 | 82 | 100 |
| Blog index | Desktop | 91 | 87 | 81 | 100 |

Scores are Lighthouse results from one controlled run per page and mode. Lighthouse scores can vary with network, CPU, CDN, and deployment conditions; repeated runs or field data should be used for trend tracking [1].

## Core Web Vitals and loading metrics

| Page | Mode | FCP | LCP | Speed Index | TBT | CLS | TTI |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Homepage | Mobile | 2.8 s | 10.7 s | 2.8 s | 320 ms | 0.001 | 10.7 s |
| Homepage | Desktop | 0.6 s | 1.9 s | 0.8 s | 50 ms | 0.014 | 1.9 s |
| Blog index | Mobile | 2.7 s | 10.9 s | 2.7 s | 40 ms | 0.000 | 11.0 s |
| Blog index | Desktop | 0.8 s | 1.9 s | 0.8 s | 0 ms | 0.015 | 1.9 s |

The desktop LCP values are strong. Mobile LCP is the main concern: the tested values are approximately 10.7–10.9 seconds, far above the commonly recommended 2.5-second “good” target at the 75th percentile [2]. CLS is very low on every tested route, so layout stability is already a strength.

## Main findings

### 1. Image delivery is the highest-priority issue

Lighthouse estimated approximately **3.9 MB** of image savings on the homepage desktop run and approximately **18.8 MB** on the blog desktop run. The mobile blog transferred approximately **20.6 MB** in total and flagged image sizing/encoding as a major opportunity. The eight-card blog layout requests several large editorial images, and the public CDN URLs currently serve large JPEG originals rather than responsive derivatives.

**Recommended fix:** create AVIF/WebP derivatives at multiple widths, use `srcSet` and `sizes`, set explicit `width` and `height`, add `loading="lazy"` to below-the-fold cards, and keep only the hero image eager. This is the clearest route to reducing mobile LCP and total page weight.

### 2. JavaScript and render-blocking work are secondary opportunities

The homepage and blog both report unused JavaScript and render-blocking requests. The homepage entry bundle remains approximately 520 kB minified before gzip in the build output. Route-level imports already exist for major pages, but the homepage still contains a large amount of interactive booking UI in its initial route.

**Recommended fix:** split lower-page booking helpers and non-critical sections further, load optional icons/components only when used, and audit the global CSS/font loading path. Keep the booking form usable without delaying the first meaningful render.

### 3. Accessibility needs a small contrast and naming pass

Accessibility scored **91** on the homepage and **87–88** on the blog. Lighthouse flagged insufficient background/foreground contrast and, on the homepage, visible text labels without matching accessible names. These are targeted fixes rather than a structural accessibility failure.

**Recommended fix:** check muted metadata text, small navigation labels, icon-only controls, and every interactive element for an accessible name. Preserve visible focus states and verify keyboard navigation after changes.

### 4. Best Practices has predictable cleanup items

Best Practices scored **81–82**. Reported items include a viewport configuration using restrictive `user-scalable`/`maximum-scale` settings, one deprecated API warning, a back/forward-cache failure reason, and image delivery inefficiencies.

**Recommended fix:** use a standard accessible viewport declaration, identify the deprecated API in the full Lighthouse details, remove unload-style handlers or other bfcache blockers if present, and re-run the audit after image optimization.

### 5. SEO is currently strong

SEO scored **100/100** on both mobile routes. The project has route-specific titles, descriptions, canonical URLs, Open Graph data, Twitter card metadata, and article-specific social images. The next organic-search improvement is not a score repair but publishing discipline: add a sitemap, verify `robots.txt`, connect Google Search Console, and monitor indexed article URLs.

## Prioritized action plan

| Priority | Action | Expected benefit | Scope |
| --- | --- | --- | --- |
| P0 | Convert the eight article images to responsive WebP/AVIF derivatives and serve mobile-sized variants | Major mobile LCP and page-weight improvement | Frontend/assets |
| P0 | Lazy-load all below-fold blog cards and reserve image dimensions | Lower initial transfer and improved layout predictability | Blog UI |
| P1 | Preload only the homepage/blog hero image and avoid eager-loading the full card grid | Faster first paint and LCP | Frontend |
| P1 | Fix contrast and accessible names flagged by Lighthouse | Accessibility score and keyboard/screen-reader quality | UI/accessibility |
| P1 | Replace restrictive viewport setting and investigate the deprecated API/bfcache finding | Better Best Practices score and mobile usability | HTML/runtime |
| P2 | Further split optional homepage booking code and reduce unused JavaScript | Lower main-thread work and bundle cost | Frontend architecture |
| P2 | Add/verify `robots.txt`, sitemap.xml, and Search Console monitoring | Stronger search operations and indexing visibility | SEO operations |

## Current conclusion

The deployment is functional and discoverable, with excellent SEO and stable layout behaviour. The main production risk is not broken functionality; it is **large image transfer on mobile**, especially on the blog index. Optimizing image formats and responsive sizes should be completed before pursuing minor visual or code-level Lighthouse gains.

## References

[1]: https://developer.chrome.com/docs/lighthouse/variability "Lighthouse variability — Chrome for Developers"
[2]: https://web.dev/articles/lcp "Largest Contentful Paint — web.dev"
[3]: https://developer.chrome.com/docs/lighthouse/performance/performance-scoring "Lighthouse performance scoring — Chrome for Developers"

## Post-optimization verification — 23 August 2026

The optimization pass was implemented and re-tested against the rebuilt production preview. Image delivery now uses compressed WebP derivatives, responsive `srcSet`/`sizes`, lazy loading for below-fold imagery, explicit sizing hints, and a lightweight WebP logo. The document shell now uses an unrestricted mobile viewport, production debug instrumentation is excluded from builds, and source maps are emitted.

| Page | Mode | Performance | Accessibility | Best Practices | SEO | Total transfer | FCP | LCP | TBT | CLS |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Homepage | Mobile | 67 | 100 | 82 | 100 | 517 KiB | 3.1 s | 4.9 s | 400 ms | 0.001 |
| Blog index | Mobile | 81 | 100 | 82 | 100 | 648 KiB | 2.8 s | 4.3 s | 20 ms | 0.001 |
| Homepage | Desktop | 98 | 100 | 81 | 100 | 595 KiB | 0.8 s | 1.0 s | 30 ms | 0.014 |
| Blog index | Desktop | 99 | 100 | 81 | 100 | 678 KiB | 0.6 s | 0.9 s | 0 ms | 0.015 |

Accessibility reached **100/100** on all tested routes after fixing contrast, picker accessible names, footer supporting text, and dark-surface eyebrow colors. SEO remains **100/100**. The remaining Best Practices score of **81–82** is caused by Lighthouse's `deprecations` audit reporting one unload-listener warning from the preview/runtime environment; no unload listener is present in the application source or built bundle, and the production HTML no longer injects the debug collector. Lighthouse still reports theoretical responsive-image savings because the public CDN serves the selected derivative without transformation metadata; the delivered WebP payload is nevertheless substantially smaller than the original audit payload.

The requested target of 95+ has been achieved for Accessibility and SEO. Best Practices cannot be honestly reported as 95+ until the external runtime deprecation is isolated or removed from the deployed environment. Mobile Performance remains the next opportunity: the homepage is 67 and blog is 81 in this controlled run, with mobile LCP around 4.3–4.9 seconds and a main JavaScript bundle above 500 kB. Further route/component splitting and a CDN that exposes width-aware image transformations are recommended for the next pass.
