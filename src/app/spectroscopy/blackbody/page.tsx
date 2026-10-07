import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/spectroscopy/blackbody' },
    title: 'Blackbody Radiation',
    description: "Planck's law spectral radiance, Wien displacement, and Stefan-Boltzmann total power."
};

const jsonLd = generateCalculatorJsonLd(
  'Blackbody Radiation',
  "Planck's law spectral radiance, Wien displacement, and Stefan-Boltzmann total power.",
  'https://photonics-calculators.vercel.app/spectroscopy/blackbody',
  { category: 'Spectroscopy' }
);

export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}
