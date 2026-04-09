import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/wave-optics/difference-frequency' },
    title: 'Difference Frequency Generation (DFG)',
  description: 'Downconversion via χ⁽²⁾: p − s i for mid-IR generation.'
};
const jsonLd = generateCalculatorJsonLd(
  `Difference Frequency Generation (DFG)',
  description: 'Downconversion via χ⁽²⁾: p − s i for mid-IR generation.'
};


const jsonLd = generateCalculatorJsonLd(
  'Difference Frequency Generation (DFG)',
  'Downconversion via χ⁽²⁾: p − s i for mid-IR generation.',
  'https://photonics-calculators.vercel.app/wave-optics/difference-frequency',
  { category: 'Wave Optics`,
  `Downconversion via χ⁽²⁾: p − s i for mid-IR generation.'
};


const jsonLd = generateCalculatorJsonLd(
  'Difference Frequency Generation (DFG)',
  'Downconversion via χ⁽²⁾: p − s i for mid-IR generation.',
  'https://photonics-calculators.vercel.app/wave-optics/difference-frequency',
  { category: 'Wave Optics`,
  `https://photonics-calculators.vercel.app/wave-optics/difference-frequency`,
  { category: `Wave Optics` }
);
export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}
