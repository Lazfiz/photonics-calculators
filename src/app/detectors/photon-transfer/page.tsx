import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/detectors/photon-transfer' },
    title: 'Photon Transfer Curve (PTC)',
    description: 'Photon transfer curve: noise vs signal, variance analysis, conversion gain, and dynamic range.'
};

const jsonLd = generateCalculatorJsonLd(
  'Photon Transfer Curve (PTC)',
  'Photon transfer curve: noise vs signal, variance analysis, conversion gain, and dynamic range.',
  'https://photonics-calculators.vercel.app/detectors/photon-transfer',
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
