import fs from "fs";
import path from "path";

const repoRoot = process.cwd();
const appDir = path.join(repoRoot, "src", "app");
const outDir = path.join(repoRoot, "src", "generated");
const outFile = path.join(outDir, "search-index.json");

const hiddenSearchRoutes = new Set([
  "/laser-safety/classification",
  "/laser-safety/pulsed-mpe",
  "/laser-safety/scanned-mpe",
  "/laser-safety/scanning-mpe",
  "/laser-safety/lidar-safety",
  "/laser-safety/interlock-design",
  "/laser-safety/multiple-pulse",
]);

function titleFromPath(route) {
  return route
    .split("/")
    .filter(Boolean)
    .pop()
    ?.split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ") ?? "Home";
}

function readIfExists(file) {
  try {
    return fs.readFileSync(file, "utf8");
  } catch {
    return "";
  }
}

function extract(content, patterns) {
  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match?.[1]) return match[1].replace(/\s+/g, " ").trim();
  }
  return null;
}

function scan(dir, prefix = "") {
  const items = [];
  for (const entry of fs.readdirSync(dir)) {
    if (entry.startsWith("_") || entry.startsWith("(")) continue;
    const fullPath = path.join(dir, entry);
    const stats = fs.statSync(fullPath);
    if (!stats.isDirectory()) continue;

    const route = `${prefix}/${entry}`;
    const pageFile = path.join(fullPath, "page.tsx");
    const pageClientFile = path.join(fullPath, "page-client.tsx");
    const content = `${readIfExists(pageFile)}\n${readIfExists(pageClientFile)}`;

    if (content.trim()) {
      const title = extract(content, [
        /export const metadata:[\s\S]*?title:\s*"([^"]+)"/,
        /export const metadata:[\s\S]*?title:\s*'([^']+)'/,
        /<CalculatorShell[\s\S]*?title="([^"]+)"/,
        /title="([^"]+)"/,
        /<h1[^>]*>([^<]+)<\/h1>/,
      ]) ?? titleFromPath(route);

      const description = extract(content, [
        /export const metadata:[\s\S]*?description:\s*"([^"]+)"/,
        /export const metadata:[\s\S]*?description:\s*'([^']+)'/,
        /<CalculatorShell[\s\S]*?description="([^"]+)"/,
        /description="([^"]+)"/,
        /<p className="text-gray-400[^"]*">([^<]+)<\/p>/,
      ]) ?? `Open ${titleFromPath(route)}.`;

      items.push({
        title,
        href: route,
        description,
        kind: prefix ? "page" : "category",
        category: prefix ? prefix.replace(/^\//, "") : entry,
      });
    }

    items.push(...scan(fullPath, route));
  }
  return items;
}

const items = scan(appDir)
  .filter((item) => item.href !== "/_not-found")
  .filter((item) => !hiddenSearchRoutes.has(item.href))
  .sort((a, b) => a.title.localeCompare(b.title));

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outFile, `${JSON.stringify(items, null, 2)}\n`);
console.log(`Wrote ${items.length} search items to ${path.relative(repoRoot, outFile)}`);
