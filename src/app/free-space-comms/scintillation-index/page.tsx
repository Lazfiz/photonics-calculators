import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/free-space-comms/scintillation-index' },
    title: 'Scintillation and Coherence Length',
  description: 'Rytov variance, scintillation index, Fried parameter, coherence length and coherence time for plane or spherical waves versus Cn² and range.'
};

const jsonLd = generateCalculatorJsonLd(
  'Scintillation and Coherence Length',
  'Rytov variance, scintillation index, Fried parameter, coherence length and coherence time for plane or spherical waves versus Cn² and range.',
  'https://photonics-calculators.vercel.app/free-space-comms/scintillation-index',
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
