import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/materials/chromatic-dispersion' },
      title: 'Chromatic Dispersion',
  description: 'Material dispersion dn/d from Sellmeier coefficients',
};
const jsonLd = generateCalculatorJsonLd(
  `Chromatic Dispersion',
  description: 'Material dispersion dn/d from Sellmeier coefficients',
};


const jsonLd = generateCalculatorJsonLd(
  'Chromatic Dispersion',
  'Material dispersion dn/d from Sellmeier coefficients',
  'https://photonics-calculators.vercel.app/materials/chromatic-dispersion',
  { category: 'Materials`,
  `Material dispersion dn/d from Sellmeier coefficients',
};


const jsonLd = generateCalculatorJsonLd(
  'Chromatic Dispersion',
  'Material dispersion dn/d from Sellmeier coefficients',
  'https://photonics-calculators.vercel.app/materials/chromatic-dispersion',
  { category: 'Materials`,
  `https://photonics-calculators.vercel.app/materials/chromatic-dispersion`,
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
