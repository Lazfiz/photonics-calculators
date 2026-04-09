import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/wave-optics/m2-factor' },
      title: 'Beam Quality Factor M²',
  description: 'M² = ( w₀ )/. M² = 1 for ideal Gaussian, higher for multimode beams.',
};
const jsonLd = generateCalculatorJsonLd(
  `Beam Quality Factor M²',
  description: 'M² = ( w₀ )/. M² = 1 for ideal Gaussian, higher for multimode beams.',
};


const jsonLd = generateCalculatorJsonLd(
  'Beam Quality Factor M²',
  'M² = ( w₀ )/. M² = 1 for ideal Gaussian, higher for multimode beams.',
  'https://photonics-calculators.vercel.app/wave-optics/m2-factor',
  { category: 'Wave Optics`,
  `M² = ( w₀ )/. M² = 1 for ideal Gaussian, higher for multimode beams.',
};


const jsonLd = generateCalculatorJsonLd(
  'Beam Quality Factor M²',
  'M² = ( w₀ )/. M² = 1 for ideal Gaussian, higher for multimode beams.',
  'https://photonics-calculators.vercel.app/wave-optics/m2-factor',
  { category: 'Wave Optics`,
  `https://photonics-calculators.vercel.app/wave-optics/m2-factor`,
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
