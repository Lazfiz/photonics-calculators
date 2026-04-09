import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/detectors/single-photon-counting-module' },
    title: 'Single Photon Counting Module',
  description: 'Interactive Single Photon Counting Module calculator for photonics and optical engineering.'
};
const jsonLd = generateCalculatorJsonLd(
  `Single Photon Counting Module',
  description: 'Interactive Single Photon Counting Module calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Single Photon Counting Module',
  'Interactive Single Photon Counting Module calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/detectors/single-photon-counting-module',
  { category: 'Detectors`,
  `Interactive Single Photon Counting Module calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Single Photon Counting Module',
  'Interactive Single Photon Counting Module calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/detectors/single-photon-counting-module',
  { category: 'Detectors`,
  `https://photonics-calculators.vercel.app/detectors/single-photon-counting-module`,
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
