import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/wave-optics/mode-matching' },
    title: 'Mode Matching',
  description: 'Find the optimal lens for coupling one Gaussian beam mode into another.'
};
const jsonLd = generateCalculatorJsonLd(
  `Mode Matching',
  description: 'Find the optimal lens for coupling one Gaussian beam mode into another.'
};


const jsonLd = generateCalculatorJsonLd(
  'Mode Matching',
  'Find the optimal lens for coupling one Gaussian beam mode into another.',
  'https://photonics-calculators.vercel.app/wave-optics/mode-matching',
  { category: 'Wave Optics`,
  `Find the optimal lens for coupling one Gaussian beam mode into another.'
};


const jsonLd = generateCalculatorJsonLd(
  'Mode Matching',
  'Find the optimal lens for coupling one Gaussian beam mode into another.',
  'https://photonics-calculators.vercel.app/wave-optics/mode-matching',
  { category: 'Wave Optics`,
  `https://photonics-calculators.vercel.app/wave-optics/mode-matching`,
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
