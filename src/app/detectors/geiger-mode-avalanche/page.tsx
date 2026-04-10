import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/detectors/geiger-mode-avalanche' },
    title: 'Geiger-Mode APD',
    description: 'SPAD: breakdown voltage, overbias, temperature effects, PDE, and dark count rate.'
};

const jsonLd = generateCalculatorJsonLd(
  'Geiger-Mode APD',
  'SPAD: breakdown voltage, overbias, temperature effects, PDE, and dark count rate.',
  'https://photonics-calculators.vercel.app/detectors/geiger-mode-avalanche',
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
