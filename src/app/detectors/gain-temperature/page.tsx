import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/detectors/gain-temperature' },
    title: 'Gain vs Temperature',
    description: 'Temperature dependence of detector gain for APDs and PMTs.'
};

const jsonLd = generateCalculatorJsonLd(
  'Gain vs Temperature',
  'Temperature dependence of detector gain for APDs and PMTs.',
  'https://photonics-calculators.vercel.app/detectors/gain-temperature',
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
