import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/wave-optics/cavity-stability' },
    title: 'Cavity Stability Diagram',
  description: 'Two-mirror cavity stability: g = 1 - L/R, g = 1 - L/R. Stable when 0 ≤ gg ≤ 1.'
};
const jsonLd = generateCalculatorJsonLd(
  `Cavity Stability Diagram',
  description: 'Two-mirror cavity stability: g = 1 - L/R, g = 1 - L/R. Stable when 0 ≤ gg ≤ 1.'
};


const jsonLd = generateCalculatorJsonLd(
  'Cavity Stability Diagram',
  'Two-mirror cavity stability: g = 1 - L/R, g = 1 - L/R. Stable when 0 ≤ gg ≤ 1.',
  'https://photonics-calculators.vercel.app/wave-optics/cavity-stability',
  { category: 'Wave Optics`,
  `Two-mirror cavity stability: g = 1 - L/R, g = 1 - L/R. Stable when 0 ≤ gg ≤ 1.'
};


const jsonLd = generateCalculatorJsonLd(
  'Cavity Stability Diagram',
  'Two-mirror cavity stability: g = 1 - L/R, g = 1 - L/R. Stable when 0 ≤ gg ≤ 1.',
  'https://photonics-calculators.vercel.app/wave-optics/cavity-stability',
  { category: 'Wave Optics`,
  `https://photonics-calculators.vercel.app/wave-optics/cavity-stability`,
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
