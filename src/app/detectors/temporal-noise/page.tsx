import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/detectors/temporal-noise' },
    title: 'Temporal Noise Calculator',
    description: '1/f noise, white noise, and read noise as functions of frequency and integration time.'
};

const jsonLd = generateCalculatorJsonLd(
  'Temporal Noise Calculator',
  '1/f noise, white noise, and read noise as functions of frequency and integration time.',
  'https://photonics-calculators.vercel.app/detectors/temporal-noise',
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
