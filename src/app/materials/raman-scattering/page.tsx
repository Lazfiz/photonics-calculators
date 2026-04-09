import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/materials/raman-scattering' },
    title: 'Raman Scattering',
  description: 'Spontaneous and stimulated Raman scattering cross-sections and gain spectra for common optical materials.'
};
const jsonLd = generateCalculatorJsonLd(
  `Raman Scattering',
  description: 'Spontaneous and stimulated Raman scattering cross-sections and gain spectra for common optical materials.'
};


const jsonLd = generateCalculatorJsonLd(
  'Raman Scattering',
  'Spontaneous and stimulated Raman scattering cross-sections and gain spectra for common optical materials.',
  'https://photonics-calculators.vercel.app/materials/raman-scattering',
  { category: 'Materials`,
  `Spontaneous and stimulated Raman scattering cross-sections and gain spectra for common optical materials.'
};


const jsonLd = generateCalculatorJsonLd(
  'Raman Scattering',
  'Spontaneous and stimulated Raman scattering cross-sections and gain spectra for common optical materials.',
  'https://photonics-calculators.vercel.app/materials/raman-scattering',
  { category: 'Materials`,
  `https://photonics-calculators.vercel.app/materials/raman-scattering`,
  { category: `Materials` }
);
export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}
