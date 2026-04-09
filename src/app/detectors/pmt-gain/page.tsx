import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/detectors/pmt-gain' },
    title: 'Pmt Gain',
  description: 'Interactive Pmt Gain calculator for photonics and optical engineering.'
};
const jsonLd = generateCalculatorJsonLd(
  `Pmt Gain',
  description: 'Interactive Pmt Gain calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Pmt Gain',
  'Interactive Pmt Gain calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/detectors/pmt-gain',
  { category: 'Detectors`,
  `Interactive Pmt Gain calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Pmt Gain',
  'Interactive Pmt Gain calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/detectors/pmt-gain',
  { category: 'Detectors`,
  `https://photonics-calculators.vercel.app/detectors/pmt-gain`,
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
