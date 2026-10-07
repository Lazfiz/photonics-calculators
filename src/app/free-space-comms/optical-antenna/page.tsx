import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/free-space-comms/optical-antenna' },
    title: 'Optical Antenna Gain',
  description: 'Telescope gain, directivity, divergence, beam waist and Rayleigh range with central obscuration, aperture efficiency and beam quality M².'
};

const jsonLd = generateCalculatorJsonLd(
  'Optical Antenna Gain',
  'Telescope gain, directivity, divergence, beam waist and Rayleigh range with central obscuration, aperture efficiency and beam quality M².',
  'https://photonics-calculators.vercel.app/free-space-comms/optical-antenna',
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
