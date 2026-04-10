import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/detectors/microchannel-plate' },
    title: 'Microchannel Plate',
    description: 'MCP gain, spatial resolution, and effective QE for photon detectors.'
};

const jsonLd = generateCalculatorJsonLd(
  'Microchannel Plate',
  'MCP gain, spatial resolution, and effective QE for photon detectors.',
  'https://photonics-calculators.vercel.app/detectors/microchannel-plate',
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
