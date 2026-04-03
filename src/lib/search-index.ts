import { readFileSync, readdirSync, statSync } from "fs";
import path from "path";

export type SearchItem = {
  title: string;
  href: string;
  description: string;
  kind: "page" | "category";
  category: string;
};

const appDir = path.join(process.cwd(), "src", "app");

function titleFromPath(route: string) {
  return route
    .split("/")
    .filter(Boolean)
    .pop()
    ?.split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ") ?? "Home";
}

function scan(dir: string, prefix = ""): SearchItem[] {
  const items: SearchItem[] = [];
  for (const entry of readdirSync(dir)) {
    if (entry.startsWith("_") || entry.startsWith("(")) continue;
    const fullPath = path.join(dir, entry);
    const stats = statSync(fullPath);
    if (!stats.isDirectory()) continue;

    const route = `${prefix}/${entry}`;
    const pageFile = path.join(fullPath, "page.tsx");

    try {
      const content = readFileSync(pageFile, "utf8");
      const titleMatch =
        content.match(/title=\"([^\"]+)\"/) ||
        content.match(/title:\s*\"([^\"]+)\"/) ||
        content.match(/<h1[^>]*>([^<]+)<\/h1>/);
      const descriptionMatch =
        content.match(/description=\"([^\"]+)\"/) ||
        content.match(/description:\s*\"([^\"]+)\"/) ||
        content.match(/<p className=\"text-gray-400[^\"]*\">([^<]+)<\/p>/);

      items.push({
        title: titleMatch?.[1] ?? titleFromPath(route),
        href: route,
        description: descriptionMatch?.[1] ?? `Open ${titleFromPath(route)}.`,
        kind: prefix ? "page" : "category",
        category: prefix ? prefix.replace(/^\//, "") : entry,
      });
    } catch {
      // ignore non-page dirs
    }

    items.push(...scan(fullPath, route));
  }
  return items;
}

export function getSearchIndex() {
  return scan(appDir)
    .filter((item) => item.href !== "/_not-found")
    .sort((a, b) => a.title.localeCompare(b.title));
}
