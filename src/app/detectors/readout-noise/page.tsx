import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/detectors/readout-noise' },
    title: 'Readout Noise',
  description: 'Interactive Readout Noise calculator for photonics and optical engineering.'
};
const jsonLd = generateCalculatorJsonLd(
  `Readout Noise',
  description: 'Interactive Readout Noise calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Readout Noise',
  'Interactive Readout Noise calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/detectors/readout-noise',
  { category: 'Detectors`,
  `Interactive Readout Noise calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Readout Noise',
  'Interactive Readout Noise calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/detectors/readout-noise',
  { category: 'Detectors`,
  `https://photonics-calculators.vercel.app/detectors/readout-noise`,
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
