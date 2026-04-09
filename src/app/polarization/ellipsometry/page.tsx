import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/polarization/ellipsometry' },
    title: 'Ellipsometry',
  description: 'Calculate Ψ, from Fresnel equations; model thin film interference in ellipsometry.'
};
const jsonLd = generateCalculatorJsonLd(
  `Ellipsometry',
  description: 'Calculate Ψ, from Fresnel equations; model thin film interference in ellipsometry.'
};


const jsonLd = generateCalculatorJsonLd(
  'Ellipsometry',
  'Calculate Ψ, from Fresnel equations; model thin film interference in ellipsometry.',
  'https://photonics-calculators.vercel.app/polarization/ellipsometry',
  { category: 'Polarization`,
  `Calculate Ψ, from Fresnel equations; model thin film interference in ellipsometry.'
};


const jsonLd = generateCalculatorJsonLd(
  'Ellipsometry',
  'Calculate Ψ, from Fresnel equations; model thin film interference in ellipsometry.',
  'https://photonics-calculators.vercel.app/polarization/ellipsometry',
  { category: 'Polarization`,
  `https://photonics-calculators.vercel.app/polarization/ellipsometry`,
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
