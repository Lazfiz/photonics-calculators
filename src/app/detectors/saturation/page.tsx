import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/detectors/saturation' },
    title: 'Saturation',
  description: 'Interactive Saturation calculator for photonics and optical engineering.'
};
const jsonLd = generateCalculatorJsonLd(
  `Saturation',
  description: 'Interactive Saturation calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Saturation',
  'Interactive Saturation calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/detectors/saturation',
  { category: 'Detectors`,
  `Interactive Saturation calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Saturation',
  'Interactive Saturation calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/detectors/saturation',
  { category: 'Detectors`,
  `https://photonics-calculators.vercel.app/detectors/saturation`,
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
