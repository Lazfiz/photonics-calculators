import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/detectors/sndr' },
    title: 'SNDR Calculator',
    description: 'Signal-to-Noise-and-Distortion Ratio, SFDR, THD, and ENOB for ADC analysis.'
};

const jsonLd = generateCalculatorJsonLd(
  'SNDR Calculator',
  'Signal-to-Noise-and-Distortion Ratio, SFDR, THD, and ENOB for ADC analysis.',
  'https://photonics-calculators.vercel.app/detectors/sndr',
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
