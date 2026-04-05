import searchIndexData from "../generated/search-index.json";

export type SearchItem = {
  title: string;
  href: string;
  description: string;
  kind: "page" | "category";
  category: string;
};

export function getSearchIndex(): SearchItem[] {
  return searchIndexData as SearchItem[];
}
