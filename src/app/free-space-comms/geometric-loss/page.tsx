import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/free-space-comms/geometric-loss' },
    title: 'FSO Geometric Loss',
  description: 'Beam diameter at the receiver, geometric spreading loss and coupling efficiency from transmitter divergence, apertures, range and wavelength.'
};

const jsonLd = generateCalculatorJsonLd(
  'FSO Geometric Loss',
  'Beam diameter at the receiver, geometric spreading loss and coupling efficiency from transmitter divergence, apertures, range and wavelength.',
  'https://photonics-calculators.vercel.app/free-space-comms/geometric-loss',
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
