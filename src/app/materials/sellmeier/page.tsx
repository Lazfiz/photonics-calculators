import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/materials/sellmeier' },
    title: 'Sellmeier Equation',
  description: 'Calculate refractive index from Sellmeier coefficients across wavelength.'
};
const jsonLd = generateCalculatorJsonLd(
  `Sellmeier Equation',
  description: 'Calculate refractive index from Sellmeier coefficients across wavelength.'
};


const jsonLd = generateCalculatorJsonLd(
  'Sellmeier Equation',
  'Calculate refractive index from Sellmeier coefficients across wavelength.',
  'https://photonics-calculators.vercel.app/materials/sellmeier',
  { category: 'Materials`,
  `Calculate refractive index from Sellmeier coefficients across wavelength.'
};


const jsonLd = generateCalculatorJsonLd(
  'Sellmeier Equation',
  'Calculate refractive index from Sellmeier coefficients across wavelength.',
  'https://photonics-calculators.vercel.app/materials/sellmeier',
  { category: 'Materials`,
  `https://photonics-calculators.vercel.app/materials/sellmeier`,
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
