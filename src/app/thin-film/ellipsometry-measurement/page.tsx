import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/thin-film/ellipsometry-measurement' },
    title: 'Ellipsometry Measurement',
  description: 'Analyze ellipsometry data (Ψ, ) to extract pseudo-dielectric function, refractive index, and approximate film thickness.'
};
const jsonLd = generateCalculatorJsonLd(
  `Ellipsometry Measurement',
  description: 'Analyze ellipsometry data (Ψ, ) to extract pseudo-dielectric function, refractive index, and approximate film thickness.'
};


const jsonLd = generateCalculatorJsonLd(
  'Ellipsometry Measurement',
  'Analyze ellipsometry data (Ψ, ) to extract pseudo-dielectric function, refractive index, and approximate film thickness.',
  'https://photonics-calculators.vercel.app/thin-film/ellipsometry-measurement',
  { category: 'Thin Film`,
  `Analyze ellipsometry data (Ψ, ) to extract pseudo-dielectric function, refractive index, and approximate film thickness.'
};


const jsonLd = generateCalculatorJsonLd(
  'Ellipsometry Measurement',
  'Analyze ellipsometry data (Ψ, ) to extract pseudo-dielectric function, refractive index, and approximate film thickness.',
  'https://photonics-calculators.vercel.app/thin-film/ellipsometry-measurement',
  { category: 'Thin Film`,
  `https://photonics-calculators.vercel.app/thin-film/ellipsometry-measurement`,
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
