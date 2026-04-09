import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/detectors/pixel-crosstalk' },
    title: 'Pixel Crosstalk',
  description: 'Interactive Pixel Crosstalk calculator for photonics and optical engineering.'
};
const jsonLd = generateCalculatorJsonLd(
  `Pixel Crosstalk',
  description: 'Interactive Pixel Crosstalk calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Pixel Crosstalk',
  'Interactive Pixel Crosstalk calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/detectors/pixel-crosstalk',
  { category: 'Detectors`,
  `Interactive Pixel Crosstalk calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Pixel Crosstalk',
  'Interactive Pixel Crosstalk calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/detectors/pixel-crosstalk',
  { category: 'Detectors`,
  `https://photonics-calculators.vercel.app/detectors/pixel-crosstalk`,
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
