import { useEffect } from "react";
import { SITE } from "../data/site";

type SeoProps = {
  title: string;
  description: string;
  path: string; // "/courses/social-media-ai"
  /** JSON-LD schema objects to inject for this page */
  schema?: object[];
};

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

export function useSeo({ title, description, path, schema }: SeoProps) {
  useEffect(() => {
    document.title = title;
    ensureMeta("name", "description").content = description;
    ensureMeta("property", "og:title").content = title;
    ensureMeta("property", "og:description").content = description;
    ensureMeta("property", "og:url").content = SITE.domain + path;
    ensureMeta("property", "og:type").content = "website";
    ensureMeta("name", "twitter:title").content = title;
    ensureMeta("name", "twitter:description").content = description;
    ensureCanonical().href = SITE.domain + path;

    document.getElementById(SCHEMA_ID)?.remove();
    if (schema && schema.length) {
      const s = document.createElement("script");
      s.type = "application/ld+json";
      s.id = SCHEMA_ID;
      s.textContent = JSON.stringify(schema.length === 1 ? schema[0] : schema);
      document.head.appendChild(s);
    }
    return () => {
      document.getElementById(SCHEMA_ID)?.remove();
    };
  }, [title, description, path, schema]);
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

export const faqSchema = (items: { q: string; a: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: items.map((i) => ({
    "@type": "Question",
    name: i.q,
    acceptedAnswer: { "@type": "Answer", text: i.a },
  })),
});
