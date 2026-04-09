import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/materials/polymer-optics' },
    title: 'Polymer Optical Materials',
  description: 'Refractive index, dispersion, and loss data for optical polymers',
};
const jsonLd = generateCalculatorJsonLd(
  `Polymer Optical Materials',
  description: 'Refractive index, dispersion, and loss data for optical polymers',
};


const jsonLd = generateCalculatorJsonLd(
  'Polymer Optical Materials',
  'Refractive index, dispersion, and loss data for optical polymers',
  'https://photonics-calculators.vercel.app/materials/polymer-optics',
  { category: 'Materials`,
  `Refractive index, dispersion, and loss data for optical polymers',
};


const jsonLd = generateCalculatorJsonLd(
  'Polymer Optical Materials',
  'Refractive index, dispersion, and loss data for optical polymers',
  'https://photonics-calculators.vercel.app/materials/polymer-optics',
  { category: 'Materials`,
  `https://photonics-calculators.vercel.app/materials/polymer-optics`,
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
