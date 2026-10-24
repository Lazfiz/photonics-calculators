/** Ranking for the home-page search over `/search-index.json`. Client-safe: no registry import. */

export interface SearchItem {
  title: string;
  href: string;
  description: string;
  kind: "page" | "category";
  category: string;
  tags: string[];
  priority: number;
}

/** Splits a query into lower-case terms. */
export function searchTerms(query: string): string[] {
  const q = query.trim().toLowerCase();
  return q.length > 0 ? q.split(/\s+/).filter(Boolean) : [];
}

/**
 * Relevance of an item: title matches weigh most, then tags, category, URL and description. Every
 * term must match one of them, or the score is 0, so a nonsense word empties the list instead of
 * leaving it to `priority` (which only breaks ties between matches).
 */
export function scoreItem(item: SearchItem, terms: string[]): number {
  const title = item.title.toLowerCase();
  const desc = item.description.toLowerCase();
  const href = item.href.toLowerCase();
  const category = item.category.toLowerCase();
  const tags = item.tags.map((tag) => tag.toLowerCase());
  const titleWords = title.split(/[^a-z0-9]+/).filter(Boolean);
  let score = 0;

  for (const term of terms) {
    let match = 0;
    if (title === term) match += 400;
    if (title.startsWith(term)) match += 220;
    if (title.includes(term)) match += 120;
    if (titleWords.some((word) => word === term)) match += 120;
    if (titleWords.some((word) => word.startsWith(term))) match += 80;
    if (category.includes(term)) match += 70;
    if (tags.some((tag) => tag === term)) match += 110;
    if (tags.some((tag) => tag.includes(term))) match += 70;
    if (href.includes(term)) match += 60;
    if (desc.includes(term)) match += 50;
    if (match === 0) return 0;
    score += match;
  }

  return terms.length > 0 ? score + item.priority : 0;
}

/** The `limit` best items for the query, best first; empty when nothing matches every term. */
export function searchItems(items: readonly SearchItem[], query: string, limit = 12): SearchItem[] {
  const terms = searchTerms(query);
  if (terms.length === 0) return [];
  return items
    .map((item) => ({ item, score: scoreItem(item, terms) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ item }) => item)
    .slice(0, limit);
}
