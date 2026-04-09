import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/detectors/photodiode-speed' },
    title: 'Photodiode Speed',
  description: 'Interactive Photodiode Speed calculator for photonics and optical engineering.'
};
const jsonLd = generateCalculatorJsonLd(
  `Photodiode Speed',
  description: 'Interactive Photodiode Speed calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Photodiode Speed',
  'Interactive Photodiode Speed calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/detectors/photodiode-speed',
  { category: 'Detectors`,
  `Interactive Photodiode Speed calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Photodiode Speed',
  'Interactive Photodiode Speed calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/detectors/photodiode-speed',
  { category: 'Detectors`,
  `https://photonics-calculators.vercel.app/detectors/photodiode-speed`,
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
