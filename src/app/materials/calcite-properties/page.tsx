import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/materials/calcite-properties' },
    title: 'Calcite (CaCO₃) Properties',
  description: 'Uniaxial negative crystal with the largest birefringence of common optical crystals. n 0.172 at 589nm.'
};
const jsonLd = generateCalculatorJsonLd(
  `Calcite (CaCO₃) Properties',
  description: 'Uniaxial negative crystal with the largest birefringence of common optical crystals. n 0.172 at 589nm.'
};


const jsonLd = generateCalculatorJsonLd(
  'Calcite (CaCO₃) Properties',
  'Uniaxial negative crystal with the largest birefringence of common optical crystals. n 0.172 at 589nm.',
  'https://photonics-calculators.vercel.app/materials/calcite-properties',
  { category: 'Materials`,
  `Uniaxial negative crystal with the largest birefringence of common optical crystals. n 0.172 at 589nm.'
};


const jsonLd = generateCalculatorJsonLd(
  'Calcite (CaCO₃) Properties',
  'Uniaxial negative crystal with the largest birefringence of common optical crystals. n 0.172 at 589nm.',
  'https://photonics-calculators.vercel.app/materials/calcite-properties',
  { category: 'Materials`,
  `https://photonics-calculators.vercel.app/materials/calcite-properties`,
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
