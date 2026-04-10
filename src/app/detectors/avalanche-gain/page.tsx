import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/detectors/avalanche-gain' },
    title: 'Avalanche Photodiode Gain',
    description: 'APD multiplication gain, excess noise factor (McIntyre), and material comparison.'
};

const jsonLd = generateCalculatorJsonLd(
  'Avalanche Photodiode Gain',
  'APD multiplication gain, excess noise factor (McIntyre), and material comparison.',
  'https://photonics-calculators.vercel.app/detectors/avalanche-gain',
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
