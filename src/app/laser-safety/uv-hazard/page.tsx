import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/laser-safety/uv-hazard' },
      title: 'UV Hazard Calculator',
  description: 'UV hazard assessment using ACGIH actinic UV weighting function S(). Covers 200–400 nm spectral region.',
};
const jsonLd = generateCalculatorJsonLd(
  `UV Hazard Calculator',
  description: 'UV hazard assessment using ACGIH actinic UV weighting function S(). Covers 200–400 nm spectral region.',
};


const jsonLd = generateCalculatorJsonLd(
  'UV Hazard Calculator',
  'UV hazard assessment using ACGIH actinic UV weighting function S(). Covers 200–400 nm spectral region.',
  'https://photonics-calculators.vercel.app/laser-safety/uv-hazard',
  { category: 'Laser Safety`,
  `UV hazard assessment using ACGIH actinic UV weighting function S(). Covers 200–400 nm spectral region.',
};


const jsonLd = generateCalculatorJsonLd(
  'UV Hazard Calculator',
  'UV hazard assessment using ACGIH actinic UV weighting function S(). Covers 200–400 nm spectral region.',
  'https://photonics-calculators.vercel.app/laser-safety/uv-hazard',
  { category: 'Laser Safety`,
  `https://photonics-calculators.vercel.app/laser-safety/uv-hazard`,
  { category: `Laser Safety` }
);
export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}
