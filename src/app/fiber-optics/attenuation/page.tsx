import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/fiber-optics/attenuation' },
    title: 'Fiber Attenuation Calculator',
    description: 'Wavelength-dependent fiber attenuation: Rayleigh scattering, IR absorption, and OH peak.'
};

const jsonLd = generateCalculatorJsonLd(
  'Fiber Attenuation Calculator',
  'Wavelength-dependent fiber attenuation: Rayleigh scattering, IR absorption, and OH peak.',
  'https://photonics-calculators.vercel.app/fiber-optics/attenuation',
  { category: 'Fiber Optics' }
);

export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}
