import type { SearchItem } from "../lib/search-index-types";
import { calculators, categories } from "./index";

const ABOUT: SearchItem = {
  title: "About Photonics Calculators",
  href: "/about",
  description: "A free, open-source collection of interactive optics and photonics calculators.",
  kind: "page",
  category: "about",
  tags: ["about"],
  priority: 40,
};

function unique(values: string[]): string[] {
  return [...new Set(values.map((v) => v.trim()).filter(Boolean))];
}

/** The site search's data, served as /search-index.json. Hidden calculators are left out. */
export function buildSearchIndex(): SearchItem[] {
  const keywordsOf = new Map(categories.map((c) => [c.id, c.keywords]));
  const items: SearchItem[] = [
    ...categories.map((c) => ({
      title: c.title,
      href: `/${c.id}`,
      description: c.description,
      kind: "category" as const,
      category: c.id,
      tags: unique([c.id, ...c.keywords]),
      priority: c.priority,
    })),
    ...calculators
      .filter((calculator) => !calculator.hidden)
      .map((calculator) => ({
        title: calculator.title,
        href: calculator.href,
        description: calculator.description,
        kind: "page" as const,
        category: calculator.category,
        tags: unique([
          calculator.category,
          calculator.slug,
          ...(keywordsOf.get(calculator.category) ?? []),
          ...(calculator.keywords ?? []),
        ]),
        priority: calculator.priority ?? 50,
      })),
    ABOUT,
  ];
  return items.sort(
    (a, b) => b.priority - a.priority || a.title.localeCompare(b.title, "en") || a.href.localeCompare(b.href, "en"),
  );
}
