import type { MetadataRoute } from "next";
import { readdirSync, statSync } from "fs";
import path from "path";

const appDir = path.join(process.cwd(), "src", "app");

function getBaseUrl() {
  const envUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_URL;

  if (!envUrl) return "https://photonics-calculators.vercel.app";
  return envUrl.startsWith("http") ? envUrl : `https://${envUrl}`;
}

function getRoutes(dir: string, prefix = ""): string[] {
  const entries = readdirSync(dir);
  const routes: string[] = [];

  for (const entry of entries) {
    if (entry.startsWith("_") || entry.startsWith("(")) continue;
    const fullPath = path.join(dir, entry);
    const stats = statSync(fullPath);

    if (stats.isDirectory()) {
      const pagePath = path.join(fullPath, "page.tsx");
      if (statSafe(pagePath)) {
        routes.push(`${prefix}/${entry}`);
      }
      routes.push(...getRoutes(fullPath, `${prefix}/${entry}`));
    }
  }

  return routes;
}

function statSafe(filePath: string) {
  try {
    return statSync(filePath).isFile();
  } catch {
    return false;
  }
}

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getBaseUrl();
  const routes = ["/", ...getRoutes(appDir)]
    .filter((route, index, all) => all.indexOf(route) === index)
    .filter((route) => route !== "/_not-found")
    .sort();

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route.split("/").length > 2 ? "monthly" : "weekly",
    priority: route === "/" ? 1 : route.split("/").length > 2 ? 0.7 : 0.85,
  }));
}
