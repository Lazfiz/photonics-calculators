import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/detectors/pixel-crosstalk' },
    title: 'Pixel Crosstalk & MTF',
    description: 'Charge diffusion and electrical crosstalk: wavelength-dependent absorption depth, total crosstalk, and MTF degradation.'
};

const jsonLd = generateCalculatorJsonLd(
  'Pixel Crosstalk & MTF',
  'Charge diffusion and electrical crosstalk: wavelength-dependent absorption depth, total crosstalk, and MTF degradation.',
  'https://photonics-calculators.vercel.app/detectors/pixel-crosstalk',
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
