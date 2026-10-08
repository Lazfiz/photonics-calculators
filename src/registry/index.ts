// Server-side only: the calculator data is ~200 KB of strings. Client components get what they need
// as props or from /search-index.json. tests/registry.test.ts enforces this.
import { categories } from "./categories";
import { detectors } from "./calculators/detectors";
import { fiberOptics } from "./calculators/fiber-optics";
import { freeSpaceComms } from "./calculators/free-space-comms";
import { imaging } from "./calculators/imaging";
import { laserSafety } from "./calculators/laser-safety";
import { materials } from "./calculators/materials";
import { polarization } from "./calculators/polarization";
import { spectroscopy } from "./calculators/spectroscopy";
import { thinFilm } from "./calculators/thin-film";
import { waveOptics } from "./calculators/wave-optics";
import type { Calculator, CalculatorEntry, Category, CategoryId } from "./types";

export type { Calculator, Category, CategoryId } from "./types";
export { categories };

const entriesByCategory: Record<CategoryId, CalculatorEntry[]> = {
  detectors,
  "fiber-optics": fiberOptics,
  "free-space-comms": freeSpaceComms,
  imaging,
  "laser-safety": laserSafety,
  materials,
  polarization,
  spectroscopy,
  "thin-film": thinFilm,
  "wave-optics": waveOptics,
};

/** Every calculator, hidden ones included, by category (home-page order) then slug. */
export const calculators: Calculator[] = categories.flatMap((category) =>
  entriesByCategory[category.id].map((entry) => ({
    ...entry,
    category: category.id,
    href: `/${category.id}/${entry.slug}`,
  })),
);

const byHref = new Map(calculators.map((calculator) => [calculator.href, calculator]));

export function getCalculator(href: string): Calculator {
  const calculator = byHref.get(href);
  if (!calculator) throw new Error(`No calculator registered at ${href}`);
  return calculator;
}

export function findCalculator(href: string): Calculator | undefined {
  return byHref.get(href);
}

export function getCategory(id: string): Category {
  const category = categories.find((c) => c.id === id);
  if (!category) throw new Error(`No category "${id}"`);
  return category;
}

export function calculatorsIn(id: CategoryId): Calculator[] {
  return calculators.filter((calculator) => calculator.category === id);
}

/** Name for cards and links: the page's heading if it has one, else its title. */
export function displayName(calculator: Calculator): string {
  return calculator.heading ?? calculator.title;
}
