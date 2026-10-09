// The calculator registry: one entry per page under src/app/<category>/<slug>/. The sitemap, the
// search index, the counts, the home page and the category index pages are generated from it.
// tests/registry.test.ts checks it against the file system; CalculatorShell renders each page from it.

export const CATEGORY_IDS = [
  "detectors",
  "fiber-optics",
  "free-space-comms",
  "imaging",
  "laser-safety",
  "materials",
  "polarization",
  "spectroscopy",
  "thin-film",
  "wave-optics",
] as const;

export type CategoryId = (typeof CATEGORY_IDS)[number];

/**
 * How far a page's model can be trusted, set by a physics audit (Phase 4). The definitions shown to readers are in
 * `tiers.ts`; a page without a tier says its model hasn't been reviewed.
 */
export type ModelTier = "exact" | "textbook" | "illustrative";

export interface Reference {
  /** Authors (year). Title. Venue or publisher, plus the equation, section or table used. No URL. */
  citation: string;
  /** `https://doi.org/10.…` when there is a DOI, else an https link to an open copy. */
  url?: string;
}

export interface RelatedLink {
  href: string;
  /** Why the target is related. Without it, the link shows the target's description. */
  note?: string;
}

export interface CalculatorEntry {
  slug: string;
  /** The page's `<title>` and its name in search, category lists and related links. */
  title: string;
  /** The meta description, also shown in search results and on cards. */
  description: string;
  /** The page's `<h1>`, when it differs from `title` (usually without "Calculator"). */
  heading?: string;
  /** The text under the `<h1>`, when it differs from `description`. */
  lede?: string;
  /** Extra search terms. */
  keywords?: string[];
  /** Search ranking; 50 when unset. */
  priority?: number;
  /** Kept out of search and the category lists; still reachable by URL and in the sitemap. */
  hidden?: true;
  /** Hand-picked related calculators, shown by pages that render related links. */
  related?: RelatedLink[];
  /** Set by a physics audit; unset means "not yet reviewed". */
  tier?: ModelTier;
  /** One or two sentences under the tier: what the model assumes or leaves out. */
  modelNote?: string;
  /** The sources the audit checked the model against. Required for the exact and textbook tiers. */
  references?: Reference[];
}

export interface Calculator extends CalculatorEntry {
  category: CategoryId;
  /** `/<category>/<slug>` */
  href: string;
}

export interface Category {
  id: CategoryId;
  /** Short name: home cards, breadcrumbs, search badges. */
  label: string;
  /** The category index page's `<title>` and meta description. */
  title: string;
  description: string;
  /** The index page's `<h1>` and the paragraph under it. */
  heading: string;
  intro?: string;
  /** Search terms added to every calculator in the category. */
  keywords: string[];
  /** Search ranking of the category page itself. */
  priority: number;
  home: {
    eyebrow: string;
    description: string;
    hoverDescription: string;
    accentFrom: string;
    accentTo: string;
    examples: string[];
  };
}
