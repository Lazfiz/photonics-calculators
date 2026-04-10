import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/detectors/saturation' },
    title: 'Detector Saturation',
    description: 'Full well capacity, dynamic range, SNR at saturation, and nonlinearity rolloff model.'
};

const jsonLd = generateCalculatorJsonLd(
  'Detector Saturation',
  'Full well capacity, dynamic range, SNR at saturation, and nonlinearity rolloff model.',
  'https://photonics-calculators.vercel.app/detectors/saturation',
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
