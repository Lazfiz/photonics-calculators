import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/detectors/cooling-benefit' },
    title: 'Cooling Benefit Calculator',
    description: 'Dark current reduction and SNR improvement from thermoelectric (TEC) or cryogenic cooling.'
};

const jsonLd = generateCalculatorJsonLd(
  'Cooling Benefit Calculator',
  'Dark current reduction and SNR improvement from thermoelectric (TEC) or cryogenic cooling.',
  'https://photonics-calculators.vercel.app/detectors/cooling-benefit',
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
