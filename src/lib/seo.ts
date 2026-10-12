import { useEffect } from "react";
import { SITE } from "../data/site";

type SeoProps = {
  title: string;
  description: string;
  path: string;
  schema?: object[];
  noindex?: boolean;
};

// Approval alone must never make a preview hostname indexable.
const PUBLIC_PATHS = new Set([
  "/", "/courses", "/courses/social-media-ai", "/courses/ai-video-content",
  "/courses/ai-business-owners", "/about", "/reviews", "/privacy", "/accessibility",
]);

export function isIndexablePath(path: string, origin: string, noindex = false) {
  return import.meta.env.PROD
    && import.meta.env.VITE_ACADEMY_PRODUCTION_APPROVED === "1"
    && origin === SITE.domain
    && PUBLIC_PATHS.has(path)
    && !noindex;
}

const ensureMeta = (attr: "name" | "property", key: string): HTMLMetaElement => {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  return el;
};

const ensureCanonical = (): HTMLLinkElement => {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement("link");
    el.rel = "canonical";
    document.head.appendChild(el);
  }
  return el;
};

const SCHEMA_ID = "page-schema";

export function useSeo({ title, description, path, schema, noindex = false }: SeoProps) {
  useEffect(() => {
    const indexable = isIndexablePath(path, window.location.origin, noindex);
    document.title = title;
    ensureMeta("name", "description").content = description;
    ensureMeta("property", "og:title").content = title;
    ensureMeta("property", "og:description").content = description;
    ensureMeta("property", "og:url").content = new URL(path, SITE.domain).href;
    ensureMeta("property", "og:type").content = "website";
    ensureMeta("name", "twitter:title").content = title;
    ensureMeta("name", "twitter:description").content = description;
    ensureMeta("name", "robots").content = indexable ? "index, follow" : "noindex, nofollow";
    if (indexable) ensureCanonical().href = new URL(path, SITE.domain).href;
    else document.head.querySelector('link[rel="canonical"]')?.remove();

    document.getElementById(SCHEMA_ID)?.remove();
    if (indexable && schema?.length) {
      const s = document.createElement("script");
      s.type = "application/ld+json";
      s.id = SCHEMA_ID;
      s.textContent = JSON.stringify(schema.length === 1 ? schema[0] : schema);
      document.head.appendChild(s);
    }
    return () => {
      document.getElementById(SCHEMA_ID)?.remove();
    };
  }, [title, description, path, schema, noindex]);
}

export const orgSchema = () => ({
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  name: SITE.name,
  alternateName: SITE.hebrewName,
  url: SITE.domain,
  founder: { "@type": "Person", name: SITE.founder.name },
});

export const courseSchema = (c: { title: string; tagline: string; slug: string }) => ({
  "@context": "https://schema.org",
  "@type": "Course",
  name: c.title,
  description: c.tagline,
  url: `${SITE.domain}/courses/${c.slug}`,
  provider: { "@type": "EducationalOrganization", name: SITE.name, url: SITE.domain },
});

export const faqSchema = (items: Array<{ q?: string; a?: string; question?: string; answer?: string }>) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: items.map((i) => ({
    "@type": "Question",
    name: i.question ?? i.q ?? "",
    acceptedAnswer: { "@type": "Answer", text: i.answer ?? i.a ?? "" },
  })),
});
