import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/materials/schott-glass' },
      title: 'Schott Glass Catalog',
  description: 'Refractive index n() from SCHOTT Sellmeier coefficients',
};
const jsonLd = generateCalculatorJsonLd(
  `Schott Glass Catalog',
  description: 'Refractive index n() from SCHOTT Sellmeier coefficients',
};


const jsonLd = generateCalculatorJsonLd(
  'Schott Glass Catalog',
  'Refractive index n() from SCHOTT Sellmeier coefficients',
  'https://photonics-calculators.vercel.app/materials/schott-glass',
  { category: 'Materials`,
  `Refractive index n() from SCHOTT Sellmeier coefficients',
};


const jsonLd = generateCalculatorJsonLd(
  'Schott Glass Catalog',
  'Refractive index n() from SCHOTT Sellmeier coefficients',
  'https://photonics-calculators.vercel.app/materials/schott-glass',
  { category: 'Materials`,
  `https://photonics-calculators.vercel.app/materials/schott-glass`,
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
