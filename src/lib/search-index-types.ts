export type SearchItem = {
  title: string;
  href: string;
  description: string;
  kind: "page" | "category";
  category: string;
  tags: string[];
  priority: number;
};
