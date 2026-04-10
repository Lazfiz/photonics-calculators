import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/detectors/readout-noise' },
    title: 'Readout Noise',
    description: 'Readout noise, dark current, shot noise, and SNR analysis for image sensors.'
};

const jsonLd = generateCalculatorJsonLd(
  'Readout Noise',
  'Readout noise, dark current, shot noise, and SNR analysis for image sensors.',
  'https://photonics-calculators.vercel.app/detectors/readout-noise',
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
