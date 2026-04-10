import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/detectors/single-photon-counting-module' },
    title: 'Single-Photon Counting Module',
    description: 'SPCM dead time correction, SNR, dark count effects, and afterpulsing analysis.'
};

const jsonLd = generateCalculatorJsonLd(
  'Single-Photon Counting Module',
  'SPCM dead time correction, SNR, dark count effects, and afterpulsing analysis.',
  'https://photonics-calculators.vercel.app/detectors/single-photon-counting-module',
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
