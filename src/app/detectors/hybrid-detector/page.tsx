import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/detectors/hybrid-detector' },
    title: 'Hybrid Detector Design',
    description: 'Photodiode + TIA hybrid — noise analysis, NEP, and gain optimization.'
};

const jsonLd = generateCalculatorJsonLd(
  'Hybrid Detector Design',
  'Photodiode + TIA hybrid — noise analysis, NEP, and gain optimization.',
  'https://photonics-calculators.vercel.app/detectors/hybrid-detector',
  { category: 'Detectors' }
);

export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}
