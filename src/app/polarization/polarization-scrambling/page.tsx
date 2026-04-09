import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/polarization/polarization-scrambling' },
    title: 'Polarization Scrambling',
  description: 'Simulate polarization scrambling: how randomizing polarization state reduces residual polarization.'
};
const jsonLd = generateCalculatorJsonLd(
  `Polarization Scrambling',
  description: 'Simulate polarization scrambling: how randomizing polarization state reduces residual polarization.'
};


const jsonLd = generateCalculatorJsonLd(
  'Polarization Scrambling',
  'Simulate polarization scrambling: how randomizing polarization state reduces residual polarization.',
  'https://photonics-calculators.vercel.app/polarization/polarization-scrambling',
  { category: 'Polarization`,
  `Simulate polarization scrambling: how randomizing polarization state reduces residual polarization.'
};


const jsonLd = generateCalculatorJsonLd(
  'Polarization Scrambling',
  'Simulate polarization scrambling: how randomizing polarization state reduces residual polarization.',
  'https://photonics-calculators.vercel.app/polarization/polarization-scrambling',
  { category: 'Polarization`,
  `https://photonics-calculators.vercel.app/polarization/polarization-scrambling`,
  { category: `Polarization` }
);
export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}
