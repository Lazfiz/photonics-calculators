// A calculator page's metadata and JSON-LD, generated from its registry entry. Server-side only.
import type { Metadata } from "next";
import { displayName, getCalculator, getCategory, type Calculator } from "./index";

export const SITE_URL = "https://photonics-calculators.vercel.app";

/** `export const metadata = calculatorMetadata(href)` in each calculator's page.tsx. */
export function calculatorMetadata(href: string): Metadata {
  const calculator = getCalculator(href);
  return {
    alternates: { canonical: `${SITE_URL}${href}` },
    title: calculator.title,
    description: calculator.description,
  };
}

/**
 * WebPage plus a BreadcrumbList that matches the visible breadcrumb (Home › category › heading), and the
 * references the page lists as `citation`. Only what the page shows: no generated FAQ, which Google's
 * structured-data rules don't allow for content that isn't on the page.
 */
export function calculatorJsonLd(calculator: Calculator): object {
  const category = getCategory(calculator.category);
  const url = `${SITE_URL}${calculator.href}`;
  const citation = (calculator.references ?? []).map((reference) => ({
    "@type": "CreativeWork",
    name: reference.citation,
    ...(reference.url ? { url: reference.url } : {}),
  }));
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        name: calculator.title,
        description: calculator.description,
        url,
        isPartOf: { "@type": "WebSite", name: "Photonics Calculators", url: SITE_URL },
        about: { "@type": "Thing", name: category.label },
        ...(citation.length > 0 ? { citation } : {}),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
          { "@type": "ListItem", position: 2, name: category.label, item: `${SITE_URL}/${category.id}` },
          { "@type": "ListItem", position: 3, name: displayName(calculator), item: url },
        ],
      },
    ],
  };
}
