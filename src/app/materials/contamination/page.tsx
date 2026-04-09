import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/materials/contamination' },
    title: 'Contamination Effects',
  description: 'Particle contamination impact on optical surfaces',
};
const jsonLd = generateCalculatorJsonLd(
  `Contamination Effects',
  description: 'Particle contamination impact on optical surfaces',
};


const jsonLd = generateCalculatorJsonLd(
  'Contamination Effects',
  'Particle contamination impact on optical surfaces',
  'https://photonics-calculators.vercel.app/materials/contamination',
  { category: 'Materials`,
  `Particle contamination impact on optical surfaces',
};


const jsonLd = generateCalculatorJsonLd(
  'Contamination Effects',
  'Particle contamination impact on optical surfaces',
  'https://photonics-calculators.vercel.app/materials/contamination',
  { category: 'Materials`,
  `https://photonics-calculators.vercel.app/materials/contamination`,
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
