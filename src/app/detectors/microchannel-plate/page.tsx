import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/detectors/microchannel-plate' },
    title: 'Microchannel Plate',
  description: 'Interactive Microchannel Plate calculator for photonics and optical engineering.'
};
const jsonLd = generateCalculatorJsonLd(
  `Microchannel Plate',
  description: 'Interactive Microchannel Plate calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Microchannel Plate',
  'Interactive Microchannel Plate calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/detectors/microchannel-plate',
  { category: 'Detectors`,
  `Interactive Microchannel Plate calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Microchannel Plate',
  'Interactive Microchannel Plate calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/detectors/microchannel-plate',
  { category: 'Detectors`,
  `https://photonics-calculators.vercel.app/detectors/microchannel-plate`,
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
