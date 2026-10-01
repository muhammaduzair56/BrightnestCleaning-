export const SITE_URL = "https://brightnestcleaning.vercel.app";
export const SITE_NAME = "BrightNest Cleaning UK";
export const DEFAULT_IMAGE = `${SITE_URL}/brightnest-social-preview.jpg`;

const DEFAULT_DESCRIPTION =
  "Thoughtful domestic and specialist cleaning across Birmingham and surrounding areas. Request a regular, deep, end-of-tenancy or tailored clean from BrightNest Cleaning UK.";

type SeoOptions = {
  title: string;
  description?: string;
  path?: string;
  type?: "website" | "article";
  image?: string;
  noindex?: boolean;
  publishedTime?: string;
  modifiedTime?: string;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
};

function absoluteUrl(value: string | undefined, fallback = DEFAULT_IMAGE) {
  if (!value) return fallback;
  try {
    return new URL(value, SITE_URL).href;
  } catch {
    return fallback;
  }
}

function upsertMeta(attribute: "name" | "property", key: string, content: string) {
  let tag = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute(attribute, key);
    document.head.appendChild(tag);
  }
  tag.content = content;
}

function upsertLink(rel: string, href: string) {
  let tag = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!tag) {
    tag = document.createElement("link");
    tag.rel = rel;
    document.head.appendChild(tag);
  }
  tag.href = href;
}

function replaceJsonLd(value: Record<string, unknown> | Record<string, unknown>[]) {
  const existing = document.head.querySelectorAll("script[data-brightnest-schema]");
  existing.forEach((script) => script.remove());
  const schemas = Array.isArray(value) ? value : [value];
  schemas.forEach((schema) => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.dataset.brightnestSchema = "true";
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);
  });
}

export function applySeo({
  title,
  description = DEFAULT_DESCRIPTION,
  path = "/",
  type = "website",
  image = DEFAULT_IMAGE,
  noindex = false,
  publishedTime,
  modifiedTime,
  jsonLd,
}: SeoOptions) {
  const canonical = new URL(path, SITE_URL).href;
  const socialImage = absoluteUrl(image);
  document.title = title;
  upsertMeta("name", "description", description);
  upsertMeta("name", "robots", noindex ? "noindex, nofollow" : "index, follow, max-image-preview:large");
  upsertMeta("property", "og:type", type);
  upsertMeta("property", "og:locale", "en_GB");
  upsertMeta("property", "og:site_name", SITE_NAME);
  upsertMeta("property", "og:title", title);
  upsertMeta("property", "og:description", description);
  upsertMeta("property", "og:url", canonical);
  upsertMeta("property", "og:image", socialImage);
  upsertMeta("property", "og:image:alt", title);
  upsertMeta("name", "twitter:card", "summary_large_image");
  upsertMeta("name", "twitter:title", title);
  upsertMeta("name", "twitter:description", description);
  upsertMeta("name", "twitter:image", socialImage);
  if (publishedTime) upsertMeta("property", "article:published_time", publishedTime);
  if (modifiedTime) upsertMeta("property", "article:modified_time", modifiedTime);
  upsertLink("canonical", canonical);
  if (jsonLd) replaceJsonLd(jsonLd);
}

export const homeSchema = [
  {
    "@context": "https://schema.org",
    "@type": "CleaningService",
    "@id": `${SITE_URL}/#business`,
    name: SITE_NAME,
    url: SITE_URL,
    description: DEFAULT_DESCRIPTION,
    image: DEFAULT_IMAGE,
    areaServed: [{ "@type": "City", name: "Birmingham" }, { "@type": "AdministrativeArea", name: "West Midlands" }],
    serviceType: ["Domestic cleaning", "Deep cleaning", "End of tenancy cleaning", "Office cleaning", "Window cleaning"],
    priceRange: "££",
    openingHours: "Mo-Su 08:00-18:00",
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    url: SITE_URL,
    name: SITE_NAME,
    publisher: { "@id": `${SITE_URL}/#business` },
    inLanguage: "en-GB",
  },
];
