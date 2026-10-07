import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/free-space-comms/beam-wander' },
    title: 'Beam Wander',
  description: 'RMS turbulence-induced beam wander and the resulting pointing loss of a Gaussian beam versus Cn², path length, beam radius and wavelength.'
};

const jsonLd = generateCalculatorJsonLd(
  'Beam Wander',
  'RMS turbulence-induced beam wander and the resulting pointing loss of a Gaussian beam versus Cn², path length, beam radius and wavelength.',
  'https://photonics-calculators.vercel.app/free-space-comms/beam-wander',
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
