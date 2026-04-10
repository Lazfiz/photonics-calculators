import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/detectors/uniformity' },
    title: 'Photoresponse Non-Uniformity Calculator',
    description: 'PRNU, DSNU, and spatial uniformity analysis for image sensors.'
};

const jsonLd = generateCalculatorJsonLd(
  'Photoresponse Non-Uniformity Calculator',
  'PRNU, DSNU, and spatial uniformity analysis for image sensors.',
  'https://photonics-calculators.vercel.app/detectors/uniformity',
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
