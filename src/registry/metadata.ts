// A calculator page's metadata and JSON-LD, generated from its registry entry. Server-side only.
import type { Metadata } from "next";
import { SITE_URL } from "../lib/site";
import { displayName, getCalculator, getCategory, type Calculator } from "./index";

export { SITE_URL };

const SITE_NAME = "Photonics Calculators";

/** The social-preview image route (src/app/og/[...path]/route.tsx): /og/<category> or /og/<category>/<slug>. */
export function ogImageUrl(...path: string[]): string {
  return `${SITE_URL}/og/${path.join("/")}`;
}

/** Open Graph and Twitter cards for a page: its own title, description, canonical URL and generated image. */
export function socialMetadata(fields: {
  title: string;
  description: string;
  canonical: string;
  imagePath: string[];
}): Pick<Metadata, "openGraph" | "twitter"> {
  const { description, canonical } = fields;
  const image = ogImageUrl(...fields.imagePath);
  // The layout's "%s | Photonics Calculators" template would apply to a plain title; spelling the rendered title out
  // keeps what is tested equal to what the page's og:title and twitter:title say. A page's openGraph replaces the
  // layout's whole object, so locale is repeated here.
  const title = { absolute: `${fields.title} | ${SITE_NAME}` };
  return {
    openGraph: {
      title,
      description,
      url: canonical,
      type: "website",
      siteName: SITE_NAME,
      locale: "en_US",
      images: [{ url: image, width: 1200, height: 630, alt: title.absolute }],
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

/** `export const metadata = calculatorMetadata(href)` in each calculator's page.tsx. */
export function calculatorMetadata(href: string): Metadata {
  const calculator = getCalculator(href);
  const canonical = `${SITE_URL}${href}`;
  return {
    alternates: { canonical },
    title: calculator.title,
    description: calculator.description,
    ...socialMetadata({
      title: calculator.title,
      description: calculator.description,
      canonical,
      imagePath: [calculator.category, calculator.slug],
    }),
  };
}

/**
 * WebPage, the free WebApplication it holds (with the references the page lists as `citation`) and a BreadcrumbList
 * that matches the visible breadcrumb (Home › category › heading). Only what the page shows: no generated FAQ, which
 * Google's structured-data rules don't allow for content that isn't on the page, and no rating.
 */
export function calculatorJsonLd(calculator: Calculator): object {
  const category = getCategory(calculator.category);
  const url = `${SITE_URL}${calculator.href}`;
  const app = `${url}#calculator`;
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
        mainEntity: { "@id": app },
      },
      {
        "@type": "WebApplication",
        "@id": app,
        name: calculator.title,
        description: calculator.description,
        url,
        applicationCategory: "EducationalApplication",
        applicationSubCategory: category.label,
        operatingSystem: "Any (web browser)",
        browserRequirements: "Requires JavaScript",
        isAccessibleForFree: true,
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
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
