import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/detectors/silicon-photodiode' },
    title: 'Silicon Photodiode',
    description: 'Si photodiode parameters: bandgap, QE, responsivity, dark current, and spectral response.'
};

const jsonLd = generateCalculatorJsonLd(
  'Silicon Photodiode',
  'Si photodiode parameters: bandgap, QE, responsivity, dark current, and spectral response.',
  'https://photonics-calculators.vercel.app/detectors/silicon-photodiode',
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
