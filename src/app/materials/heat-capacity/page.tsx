import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/materials/heat-capacity' },
    title: 'Heat Capacity of Optical Materials',
  description: 'Specific heat and thermal energy storage',
};
const jsonLd = generateCalculatorJsonLd(
  `Heat Capacity of Optical Materials',
  description: 'Specific heat and thermal energy storage',
};


const jsonLd = generateCalculatorJsonLd(
  'Heat Capacity of Optical Materials',
  'Specific heat and thermal energy storage',
  'https://photonics-calculators.vercel.app/materials/heat-capacity',
  { category: 'Materials`,
  `Specific heat and thermal energy storage',
};


const jsonLd = generateCalculatorJsonLd(
  'Heat Capacity of Optical Materials',
  'Specific heat and thermal energy storage',
  'https://photonics-calculators.vercel.app/materials/heat-capacity',
  { category: 'Materials`,
  `https://photonics-calculators.vercel.app/materials/heat-capacity`,
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
