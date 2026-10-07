import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/free-space-comms/diversity-reception' },
    title: 'Diversity Reception',
  description: 'Diversity gain, combined scintillation and outage probability for selection, equal-gain and maximal-ratio combining with N receivers in turbulence.'
};

const jsonLd = generateCalculatorJsonLd(
  'Diversity Reception',
  'Diversity gain, combined scintillation and outage probability for selection, equal-gain and maximal-ratio combining with N receivers in turbulence.',
  'https://photonics-calculators.vercel.app/free-space-comms/diversity-reception',
  { category: 'Free Space Comms' }
);

export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}
