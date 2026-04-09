import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/thin-film/dielectric-high-reflector' },
    title: 'Dielectric High Reflector',
  description: 'Quarter-wave dielectric stack HR mirror — stopband width, peak reflectance, and dispersion.'
};
const jsonLd = generateCalculatorJsonLd(
  `Dielectric High Reflector',
  description: 'Quarter-wave dielectric stack HR mirror — stopband width, peak reflectance, and dispersion.'
};


const jsonLd = generateCalculatorJsonLd(
  'Dielectric High Reflector',
  'Quarter-wave dielectric stack HR mirror — stopband width, peak reflectance, and dispersion.',
  'https://photonics-calculators.vercel.app/thin-film/dielectric-high-reflector',
  { category: 'Thin Film`,
  `Quarter-wave dielectric stack HR mirror — stopband width, peak reflectance, and dispersion.'
};


const jsonLd = generateCalculatorJsonLd(
  'Dielectric High Reflector',
  'Quarter-wave dielectric stack HR mirror — stopband width, peak reflectance, and dispersion.',
  'https://photonics-calculators.vercel.app/thin-film/dielectric-high-reflector',
  { category: 'Thin Film`,
  `https://photonics-calculators.vercel.app/thin-film/dielectric-high-reflector`,
  { category: `Thin Film` }
);
export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}
