import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/materials/optical-glass-catalog' },
      title: 'Optical Glass Catalog',
  description: 'Interactive glass map and dispersion curves. Sellmeier: n²() = 1 + Σ Bi²/(² - Ci)',
};
const jsonLd = generateCalculatorJsonLd(
  `Optical Glass Catalog',
  description: 'Interactive glass map and dispersion curves. Sellmeier: n²() = 1 + Σ Bi²/(² - Ci)',
};


const jsonLd = generateCalculatorJsonLd(
  'Optical Glass Catalog',
  'Interactive glass map and dispersion curves. Sellmeier: n²() = 1 + Σ Bi²/(² - Ci)',
  'https://photonics-calculators.vercel.app/materials/optical-glass-catalog',
  { category: 'Materials`,
  `Interactive glass map and dispersion curves. Sellmeier: n²() = 1 + Σ Bi²/(² - Ci)',
};


const jsonLd = generateCalculatorJsonLd(
  'Optical Glass Catalog',
  'Interactive glass map and dispersion curves. Sellmeier: n²() = 1 + Σ Bi²/(² - Ci)',
  'https://photonics-calculators.vercel.app/materials/optical-glass-catalog',
  { category: 'Materials`,
  `https://photonics-calculators.vercel.app/materials/optical-glass-catalog`,
  { category: `Materials` }
);
export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}
