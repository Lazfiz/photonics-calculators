import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/polarization/degree-polarization' },
    title: 'Degree of Polarization',
  description: 'Calculate DoP from Stokes parameters, decompose into polarized and unpolarized components.'
};
const jsonLd = generateCalculatorJsonLd(
  `Degree of Polarization',
  description: 'Calculate DoP from Stokes parameters, decompose into polarized and unpolarized components.'
};


const jsonLd = generateCalculatorJsonLd(
  'Degree of Polarization',
  'Calculate DoP from Stokes parameters, decompose into polarized and unpolarized components.',
  'https://photonics-calculators.vercel.app/polarization/degree-polarization',
  { category: 'Polarization`,
  `Calculate DoP from Stokes parameters, decompose into polarized and unpolarized components.'
};


const jsonLd = generateCalculatorJsonLd(
  'Degree of Polarization',
  'Calculate DoP from Stokes parameters, decompose into polarized and unpolarized components.',
  'https://photonics-calculators.vercel.app/polarization/degree-polarization',
  { category: 'Polarization`,
  `https://photonics-calculators.vercel.app/polarization/degree-polarization`,
  { category: `Polarization` }
);
export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}
