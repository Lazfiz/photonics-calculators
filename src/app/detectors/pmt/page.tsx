import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/detectors/pmt' },
    title: 'Pmt',
  description: 'Interactive Pmt calculator for photonics and optical engineering.'
};
const jsonLd = generateCalculatorJsonLd(
  `Pmt',
  description: 'Interactive Pmt calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Pmt',
  'Interactive Pmt calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/detectors/pmt',
  { category: 'Detectors`,
  `Interactive Pmt calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Pmt',
  'Interactive Pmt calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/detectors/pmt',
  { category: 'Detectors`,
  `https://photonics-calculators.vercel.app/detectors/pmt`,
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
