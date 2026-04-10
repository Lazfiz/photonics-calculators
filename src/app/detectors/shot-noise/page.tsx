import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/detectors/shot-noise' },
    title: 'Shot Noise',
    description: 'Shot noise current, SNR, and noise vs signal analysis for photodetectors.'
};

const jsonLd = generateCalculatorJsonLd(
  'Shot Noise',
  'Shot noise current, SNR, and noise vs signal analysis for photodetectors.',
  'https://photonics-calculators.vercel.app/detectors/shot-noise',
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
