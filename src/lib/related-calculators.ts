import type { RelatedCalculatorItem } from "../components/related-calculator-links";
import type { SearchItem } from "./search-index-types";
import searchIndexData from "../generated/search-index.json";
import { flagshipRelated } from "./flagship-related";

const overrides: Record<string, RelatedCalculatorItem[]> = flagshipRelated;

function titleWords(text: string) {
  return new Set(
    text
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length > 2)
  );
}

export function getRelatedCalculators(currentHref: string, limit = 4): RelatedCalculatorItem[] {
  if (overrides[currentHref]) return overrides[currentHref].slice(0, limit);

  const items = searchIndexData as unknown as SearchItem[];
  const current = items.find((item) => item.href === currentHref);
  if (!current) return [];

  const currentWords = titleWords(`${current.title} ${current.description}`);

  const scored = items
    .filter((item) => item.href !== currentHref && item.kind === "page")
    .map((item) => {
      let score = 0;
      if (item.category === current.category) score += 5;
      const words = titleWords(`${item.title} ${item.description}`);
      for (const word of words) {
        if (currentWords.has(word)) score += 1;
      }
      return { item, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title))
    .slice(0, limit)
    .map(({ item }) => ({ href: item.href, label: item.title, desc: item.description }));

  return scored;
}
