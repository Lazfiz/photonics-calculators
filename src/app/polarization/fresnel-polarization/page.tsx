import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/polarization/fresnel-polarization' },
    title: 'Fresnel Polarization Calculator',
  description: 'Compute Fresnel reflection/transmission coefficients and analyze polarization-dependent effects at dielectric interfaces.'
};
const jsonLd = generateCalculatorJsonLd(
  `Fresnel Polarization Calculator',
  description: 'Compute Fresnel reflection/transmission coefficients and analyze polarization-dependent effects at dielectric interfaces.'
};


const jsonLd = generateCalculatorJsonLd(
  'Fresnel Polarization Calculator',
  'Compute Fresnel reflection/transmission coefficients and analyze polarization-dependent effects at dielectric interfaces.',
  'https://photonics-calculators.vercel.app/polarization/fresnel-polarization',
  { category: 'Polarization`,
  `Compute Fresnel reflection/transmission coefficients and analyze polarization-dependent effects at dielectric interfaces.'
};


const jsonLd = generateCalculatorJsonLd(
  'Fresnel Polarization Calculator',
  'Compute Fresnel reflection/transmission coefficients and analyze polarization-dependent effects at dielectric interfaces.',
  'https://photonics-calculators.vercel.app/polarization/fresnel-polarization',
  { category: 'Polarization`,
  `https://photonics-calculators.vercel.app/polarization/fresnel-polarization`,
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
