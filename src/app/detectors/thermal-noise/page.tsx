import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/detectors/thermal-noise' },
    title: 'Johnson (Thermal) Noise Calculator',
    description: 'Thermal noise voltage, current, and power across a resistor.'
};

const jsonLd = generateCalculatorJsonLd(
  'Johnson (Thermal) Noise Calculator',
  'Thermal noise voltage, current, and power across a resistor.',
  'https://photonics-calculators.vercel.app/detectors/thermal-noise',
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
