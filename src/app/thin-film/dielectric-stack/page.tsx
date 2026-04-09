import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/thin-film/dielectric-stack' },
    title: 'Dielectric Stack Theory',
  description: 'Quarter-wave dielectric stack reflectance. Alternating high/low index layers create high-reflectance mirrors — the basis of dielectric mirrors and VCSELs.'
};
const jsonLd = generateCalculatorJsonLd(
  `Dielectric Stack Theory',
  description: 'Quarter-wave dielectric stack reflectance. Alternating high/low index layers create high-reflectance mirrors — the basis of dielectric mirrors and VCSELs.'
};


const jsonLd = generateCalculatorJsonLd(
  'Dielectric Stack Theory',
  'Quarter-wave dielectric stack reflectance. Alternating high/low index layers create high-reflectance mirrors — the basis of dielectric mirrors and VCSELs.',
  'https://photonics-calculators.vercel.app/thin-film/dielectric-stack',
  { category: 'Thin Film`,
  `Quarter-wave dielectric stack reflectance. Alternating high/low index layers create high-reflectance mirrors — the basis of dielectric mirrors and VCSELs.'
};


const jsonLd = generateCalculatorJsonLd(
  'Dielectric Stack Theory',
  'Quarter-wave dielectric stack reflectance. Alternating high/low index layers create high-reflectance mirrors — the basis of dielectric mirrors and VCSELs.',
  'https://photonics-calculators.vercel.app/thin-film/dielectric-stack',
  { category: 'Thin Film`,
  `https://photonics-calculators.vercel.app/thin-film/dielectric-stack`,
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
