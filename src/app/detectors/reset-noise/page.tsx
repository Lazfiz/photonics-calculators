import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/detectors/reset-noise' },
    title: 'Reset Noise',
  description: 'Interactive Reset Noise calculator for photonics and optical engineering.'
};
const jsonLd = generateCalculatorJsonLd(
  `Reset Noise',
  description: 'Interactive Reset Noise calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Reset Noise',
  'Interactive Reset Noise calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/detectors/reset-noise',
  { category: 'Detectors`,
  `Interactive Reset Noise calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Reset Noise',
  'Interactive Reset Noise calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/detectors/reset-noise',
  { category: 'Detectors`,
  `https://photonics-calculators.vercel.app/detectors/reset-noise`,
  { category: `Detectors` }
);
export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}
