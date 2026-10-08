// Server-side: reads the registry. Client components receive HomeCategory values as props.
import { calculators, calculatorsIn, categories } from "../registry";

export type HomeCategory = {
  id: string;
  href: string;
  title: string;
  eyebrow: string;
  description: string;
  hoverDescription: string;
  /** Calculator pages in the category, hidden ones included. */
  count: number;
  accentFrom: string;
  accentTo: string;
  examples: string[];
};

export const homeCategories: HomeCategory[] = categories.map((category) => ({
  id: category.id,
  href: `/${category.id}`,
  title: category.label,
  count: calculatorsIn(category.id).length,
  ...category.home,
}));

export const featuredHeroCategoryIds = ["spectroscopy", "imaging", "thin-film"] as const;

export const featuredHeroCategories = homeCategories.filter((category) =>
  featuredHeroCategoryIds.includes(category.id as (typeof featuredHeroCategoryIds)[number])
);

/** Every calculator page on the site, hidden ones included. */
export const totalCalculatorCount: number = calculators.length;
