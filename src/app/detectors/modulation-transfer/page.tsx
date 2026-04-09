import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/detectors/modulation-transfer' },
    title: 'Modulation Transfer',
  description: 'Interactive Modulation Transfer calculator for photonics and optical engineering.'
};
const jsonLd = generateCalculatorJsonLd(
  `Modulation Transfer',
  description: 'Interactive Modulation Transfer calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Modulation Transfer',
  'Interactive Modulation Transfer calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/detectors/modulation-transfer',
  { category: 'Detectors`,
  `Interactive Modulation Transfer calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Modulation Transfer',
  'Interactive Modulation Transfer calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/detectors/modulation-transfer',
  { category: 'Detectors`,
  `https://photonics-calculators.vercel.app/detectors/modulation-transfer`,
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
