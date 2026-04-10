import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/detectors/afterpulsing' },
    title: 'Afterpulsing in APDs',
    description: 'Afterpulse probability, trap dynamics, and dead time trade-offs in avalanche photodiodes.'
};

const jsonLd = generateCalculatorJsonLd(
  'Afterpulsing in APDs',
  'Afterpulse probability, trap dynamics, and dead time trade-offs in avalanche photodiodes.',
  'https://photonics-calculators.vercel.app/detectors/afterpulsing',
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
