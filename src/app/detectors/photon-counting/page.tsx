import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/detectors/photon-counting' },
    title: 'Photon Counting Statistics',
    description: 'Poisson statistics, SNR, dead time corrections, and count distributions.'
};

const jsonLd = generateCalculatorJsonLd(
  'Photon Counting Statistics',
  'Poisson statistics, SNR, dead time corrections, and count distributions.',
  'https://photonics-calculators.vercel.app/detectors/photon-counting',
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
