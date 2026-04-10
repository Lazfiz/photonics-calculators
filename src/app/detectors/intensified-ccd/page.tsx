import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/detectors/intensified-ccd' },
    title: 'Intensified CCD (ICCD)',
    description: 'Photocathode → MCP → phosphor → CCD gain chain with gating and noise analysis.'
};

const jsonLd = generateCalculatorJsonLd(
  'Intensified CCD (ICCD)',
  'Photocathode → MCP → phosphor → CCD gain chain with gating and noise analysis.',
  'https://photonics-calculators.vercel.app/detectors/intensified-ccd',
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
