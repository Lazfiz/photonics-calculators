import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/detectors/modulation-transfer' },
    title: 'Modulation Transfer Function (MTF)',
    description: 'Image sensor MTF: pixel aperture, charge diffusion, and optical blur contributions.'
};

const jsonLd = generateCalculatorJsonLd(
  'Modulation Transfer Function (MTF)',
  'Image sensor MTF: pixel aperture, charge diffusion, and optical blur contributions.',
  'https://photonics-calculators.vercel.app/detectors/modulation-transfer',
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
