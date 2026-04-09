import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/wave-optics/sum-frequency' },
    title: 'Sum Frequency Generation (SFG)',
  description: 'Upconversion via χ⁽²⁾: 1 + 2 3 with phase matching.'
};
const jsonLd = generateCalculatorJsonLd(
  `Sum Frequency Generation (SFG)',
  description: 'Upconversion via χ⁽²⁾: 1 + 2 3 with phase matching.'
};


const jsonLd = generateCalculatorJsonLd(
  'Sum Frequency Generation (SFG)',
  'Upconversion via χ⁽²⁾: 1 + 2 3 with phase matching.',
  'https://photonics-calculators.vercel.app/wave-optics/sum-frequency',
  { category: 'Wave Optics`,
  `Upconversion via χ⁽²⁾: 1 + 2 3 with phase matching.'
};


const jsonLd = generateCalculatorJsonLd(
  'Sum Frequency Generation (SFG)',
  'Upconversion via χ⁽²⁾: 1 + 2 3 with phase matching.',
  'https://photonics-calculators.vercel.app/wave-optics/sum-frequency',
  { category: 'Wave Optics`,
  `https://photonics-calculators.vercel.app/wave-optics/sum-frequency`,
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
