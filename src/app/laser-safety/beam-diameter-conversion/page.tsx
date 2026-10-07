import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/laser-safety/beam-diameter-conversion' },
    title: 'Beam Diameter Conversion',
  description: 'Convert Gaussian beam diameters between the 1/e², 1/e and FWHM definitions and the waist radius w₀, with relative intensity levels.'
};

const jsonLd = generateCalculatorJsonLd(
  'Beam Diameter Conversion',
  'Convert Gaussian beam diameters between the 1/e², 1/e and FWHM definitions and the waist radius w₀, with relative intensity levels.',
  'https://photonics-calculators.vercel.app/laser-safety/beam-diameter-conversion',
  { category: 'Laser Safety' }
);

export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}
