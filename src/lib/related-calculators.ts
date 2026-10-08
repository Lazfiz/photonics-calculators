import type { RelatedCalculatorItem } from "../components/related-calculator-links";
import { calculators, displayName, findCalculator, type Calculator } from "../registry";

function titleWords(text: string) {
  return new Set(
    text
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length > 2)
  );
}

function item(calculator: Calculator, note?: string): RelatedCalculatorItem {
  return { href: calculator.href, label: displayName(calculator), desc: note ?? calculator.description };
}

/** The registry's hand-picked links, else the same-category pages that share the most words. */
export function getRelatedCalculators(currentHref: string, limit = 4): RelatedCalculatorItem[] {
  const current = findCalculator(currentHref);
  if (!current) return [];
  if (current.related) {
    return current.related.slice(0, limit).flatMap((link) => {
      const target = findCalculator(link.href);
      return target ? [item(target, link.note)] : [];
    });
  }

  const currentWords = titleWords(`${current.title} ${current.description}`);

  return calculators
    .filter((c) => c.href !== currentHref && !c.hidden)
    .map((c) => {
      let score = 0;
      if (c.category === current.category) score += 5;
      for (const word of titleWords(`${c.title} ${c.description}`)) {
        if (currentWords.has(word)) score += 1;
      }
      return { c, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.c.title.localeCompare(b.c.title, "en"))
    .slice(0, limit)
    .map(({ c }) => item(c));
}
