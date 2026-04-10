import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/detectors/reset-noise' },
    title: 'KTC Reset Noise',
    description: 'KTC reset noise voltage, noise charge, and conversion gain for image sensors.'
};

const jsonLd = generateCalculatorJsonLd(
  'KTC Reset Noise',
  'KTC reset noise voltage, noise charge, and conversion gain for image sensors.',
  'https://photonics-calculators.vercel.app/detectors/reset-noise',
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
