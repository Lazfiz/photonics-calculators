import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/wave-optics/beam-waist-matching' },
    title: 'Beam Waist Matching',
  description: 'Find the optimal lens for coupling one Gaussian mode into another.'
};
const jsonLd = generateCalculatorJsonLd(
  `Beam Waist Matching',
  description: 'Find the optimal lens for coupling one Gaussian mode into another.'
};


const jsonLd = generateCalculatorJsonLd(
  'Beam Waist Matching',
  'Find the optimal lens for coupling one Gaussian mode into another.',
  'https://photonics-calculators.vercel.app/wave-optics/beam-waist-matching',
  { category: 'Wave Optics`,
  `Find the optimal lens for coupling one Gaussian mode into another.'
};


const jsonLd = generateCalculatorJsonLd(
  'Beam Waist Matching',
  'Find the optimal lens for coupling one Gaussian mode into another.',
  'https://photonics-calculators.vercel.app/wave-optics/beam-waist-matching',
  { category: 'Wave Optics`,
  `https://photonics-calculators.vercel.app/wave-optics/beam-waist-matching`,
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
