import type { MetadataRoute } from "next";
import searchIndex from "../../public/search-index.json";

function getBaseUrl() {
  const envUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_URL;

  if (!envUrl) return "https://photonics-calculators.vercel.app";
  return envUrl.startsWith("http") ? envUrl : `https://${envUrl}`;
}

interface SearchItem {
  href: string;
  kind: string;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getBaseUrl();
  const items = searchIndex as unknown as SearchItem[];

  const routes = [
    "/",
    ...new Set(
      items
        .map((item) => item.href)
        .filter((href) => href.startsWith("/") && href !== "/_not-found")
    ),
  ].sort();

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route.split("/").length > 2 ? "monthly" : "weekly",
    priority: route === "/" ? 1 : route.split("/").length > 2 ? 0.7 : 0.85,
  }));
}
