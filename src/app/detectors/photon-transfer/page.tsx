import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/detectors/photon-transfer' },
    title: 'Photon Transfer',
  description: 'Interactive Photon Transfer calculator for photonics and optical engineering.'
};
const jsonLd = generateCalculatorJsonLd(
  `Photon Transfer',
  description: 'Interactive Photon Transfer calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Photon Transfer',
  'Interactive Photon Transfer calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/detectors/photon-transfer',
  { category: 'Detectors`,
  `Interactive Photon Transfer calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Photon Transfer',
  'Interactive Photon Transfer calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/detectors/photon-transfer',
  { category: 'Detectors`,
  `https://photonics-calculators.vercel.app/detectors/photon-transfer`,
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
