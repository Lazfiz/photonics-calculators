import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/detectors/vacuum-photodiode' },
    title: 'Vacuum Photodiode Calculator',
    description: 'Photoemission, responsivity, dark current, and frequency response for vacuum photodiodes.'
};

const jsonLd = generateCalculatorJsonLd(
  'Vacuum Photodiode Calculator',
  'Photoemission, responsivity, dark current, and frequency response for vacuum photodiodes.',
  'https://photonics-calculators.vercel.app/detectors/vacuum-photodiode',
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
