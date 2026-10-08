import type { MetadataRoute } from "next";
import { calculators, categories } from "../registry";

const BASE_URL = "https://photonics-calculators.vercel.app";

/** Home, about, the category pages and every calculator (hidden ones too: they are public pages). */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return [
    { url: `${BASE_URL}/`, lastModified, changeFrequency: "monthly", priority: 1 },
    { url: `${BASE_URL}/about`, lastModified, changeFrequency: "weekly", priority: 0.8 },
    ...categories.map((category) => ({
      url: `${BASE_URL}/${category.id}`,
      lastModified,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...calculators.map((calculator) => ({
      url: `${BASE_URL}${calculator.href}`,
      lastModified,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];
}
