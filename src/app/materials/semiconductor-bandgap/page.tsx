import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/materials/semiconductor-bandgap' },
    title: 'Semiconductor Bandgap',
  description: 'Bandgap energy and absorption edge vs temperature using the Varshni equation. Direct vs indirect gap materials.'
};
const jsonLd = generateCalculatorJsonLd(
  `Semiconductor Bandgap',
  description: 'Bandgap energy and absorption edge vs temperature using the Varshni equation. Direct vs indirect gap materials.'
};


const jsonLd = generateCalculatorJsonLd(
  'Semiconductor Bandgap',
  'Bandgap energy and absorption edge vs temperature using the Varshni equation. Direct vs indirect gap materials.',
  'https://photonics-calculators.vercel.app/materials/semiconductor-bandgap',
  { category: 'Materials`,
  `Bandgap energy and absorption edge vs temperature using the Varshni equation. Direct vs indirect gap materials.'
};


const jsonLd = generateCalculatorJsonLd(
  'Semiconductor Bandgap',
  'Bandgap energy and absorption edge vs temperature using the Varshni equation. Direct vs indirect gap materials.',
  'https://photonics-calculators.vercel.app/materials/semiconductor-bandgap',
  { category: 'Materials`,
  `https://photonics-calculators.vercel.app/materials/semiconductor-bandgap`,
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
