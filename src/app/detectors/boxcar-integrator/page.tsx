import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/detectors/boxcar-integrator' },
    title: 'Boxcar Integrator',
  description: 'Gated signal averaging — recover repetitive signals from noise.'
};
const jsonLd = generateCalculatorJsonLd(
  `Boxcar Integrator',
  description: 'Gated signal averaging — recover repetitive signals from noise.'
};


const jsonLd = generateCalculatorJsonLd(
  'Boxcar Integrator',
  'Gated signal averaging — recover repetitive signals from noise.',
  'https://photonics-calculators.vercel.app/detectors/boxcar-integrator',
  { category: 'Detectors`,
  `Gated signal averaging — recover repetitive signals from noise.'
};


const jsonLd = generateCalculatorJsonLd(
  'Boxcar Integrator',
  'Gated signal averaging — recover repetitive signals from noise.',
  'https://photonics-calculators.vercel.app/detectors/boxcar-integrator',
  { category: 'Detectors`,
  `https://photonics-calculators.vercel.app/detectors/boxcar-integrator`,
  { category: `Detectors` }
);
export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}
