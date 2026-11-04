// Server-side: reads the registry. Client components receive HomeCategory values as props.
import { calculators, calculatorsIn, categories, getCalculator } from "../registry";

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

export type HeroBranchId = "spectral" | "imaging" | "interference";

export type HeroBranch = {
  id: HeroBranchId;
  href: string;
  title: string;
  count: number;
  calculators: { href: string; title: string }[];
};

const heroSpec: { id: HeroBranchId; category: string; calculators: string[] }[] = [
  {
    id: "spectral",
    category: "spectroscopy",
    calculators: ["/spectroscopy/dispersive-element", "/materials/chromatic-dispersion", "/spectroscopy/wavenumber-converter"],
  },
  {
    id: "imaging",
    category: "imaging",
    calculators: ["/wave-optics/gaussian-beam", "/imaging/airy-disk", "/imaging/afocal"],
  },
  {
    id: "interference",
    category: "wave-optics",
    calculators: ["/spectroscopy/etalon-fsr", "/thin-film/fabry-perot-filter", "/wave-optics/optical-waveguide"],
  },
];

/** The three branches of the home-page chip hero, each linking to its category and three real calculators. */
export const heroBranches: HeroBranch[] = heroSpec.map((spec) => {
  const category = homeCategories.find((c) => c.id === spec.category);
  if (!category) throw new Error(`Hero branch ${spec.id}: unknown category ${spec.category}`);
  return {
    id: spec.id,
    href: category.href,
    title: category.title,
    count: category.count,
    calculators: spec.calculators.map((href) => {
      const calculator = getCalculator(href);
      return { href, title: calculator.heading ?? calculator.title };
    }),
  };
});

/** Every calculator page on the site, hidden ones included. */
export const totalCalculatorCount: number = calculators.length;
