import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/detectors/photon-counting' },
    title: 'Photon Counting',
  description: 'Interactive Photon Counting calculator for photonics and optical engineering.'
};
const jsonLd = generateCalculatorJsonLd(
  `Photon Counting',
  description: 'Interactive Photon Counting calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Photon Counting',
  'Interactive Photon Counting calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/detectors/photon-counting',
  { category: 'Detectors`,
  `Interactive Photon Counting calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Photon Counting',
  'Interactive Photon Counting calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/detectors/photon-counting',
  { category: 'Detectors`,
  `https://photonics-calculators.vercel.app/detectors/photon-counting`,
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
