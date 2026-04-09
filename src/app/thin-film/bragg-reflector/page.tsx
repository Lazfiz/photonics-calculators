import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/thin-film/bragg-reflector' },
    title: 'Bragg Reflector',
  description: 'Dielectric distributed Bragg reflector — reflectance spectrum and stopband design.'
};
const jsonLd = generateCalculatorJsonLd(
  `Bragg Reflector',
  description: 'Dielectric distributed Bragg reflector — reflectance spectrum and stopband design.'
};


const jsonLd = generateCalculatorJsonLd(
  'Bragg Reflector',
  'Dielectric distributed Bragg reflector — reflectance spectrum and stopband design.',
  'https://photonics-calculators.vercel.app/thin-film/bragg-reflector',
  { category: 'Thin Film`,
  `Dielectric distributed Bragg reflector — reflectance spectrum and stopband design.'
};


const jsonLd = generateCalculatorJsonLd(
  'Bragg Reflector',
  'Dielectric distributed Bragg reflector — reflectance spectrum and stopband design.',
  'https://photonics-calculators.vercel.app/thin-film/bragg-reflector',
  { category: 'Thin Film`,
  `https://photonics-calculators.vercel.app/thin-film/bragg-reflector`,
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
