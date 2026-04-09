import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/materials/nonlinear-crystals' },
    title: 'Nonlinear Crystal Comparison',
  description: 'SHG, OPO, and frequency conversion crystal properties',
};
const jsonLd = generateCalculatorJsonLd(
  `Nonlinear Crystal Comparison',
  description: 'SHG, OPO, and frequency conversion crystal properties',
};


const jsonLd = generateCalculatorJsonLd(
  'Nonlinear Crystal Comparison',
  'SHG, OPO, and frequency conversion crystal properties',
  'https://photonics-calculators.vercel.app/materials/nonlinear-crystals',
  { category: 'Materials`,
  `SHG, OPO, and frequency conversion crystal properties',
};


const jsonLd = generateCalculatorJsonLd(
  'Nonlinear Crystal Comparison',
  'SHG, OPO, and frequency conversion crystal properties',
  'https://photonics-calculators.vercel.app/materials/nonlinear-crystals',
  { category: 'Materials`,
  `https://photonics-calculators.vercel.app/materials/nonlinear-crystals`,
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
