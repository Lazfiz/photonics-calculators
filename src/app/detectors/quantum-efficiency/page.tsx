import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/detectors/quantum-efficiency' },
    title: 'Quantum Efficiency',
    description: 'Detector QE explorer: Si, InGaAs, CCD, CMOS presets with fill factor and microlens gain.'
};

const jsonLd = generateCalculatorJsonLd(
  'Quantum Efficiency',
  'Detector QE explorer: Si, InGaAs, CCD, CMOS presets with fill factor and microlens gain.',
  'https://photonics-calculators.vercel.app/detectors/quantum-efficiency',
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
