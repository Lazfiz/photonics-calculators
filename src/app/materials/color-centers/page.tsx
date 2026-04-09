import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/materials/color-centers' },
    title: 'Color Centers in Crystals',
  description: 'Point defects and impurity centers: absorption/emission spectra, cross-sections, and ZPL characteristics. Key for quantum emitters and tunable lasers.'
};
const jsonLd = generateCalculatorJsonLd(
  `Color Centers in Crystals',
  description: 'Point defects and impurity centers: absorption/emission spectra, cross-sections, and ZPL characteristics. Key for quantum emitters and tunable lasers.'
};


const jsonLd = generateCalculatorJsonLd(
  'Color Centers in Crystals',
  'Point defects and impurity centers: absorption/emission spectra, cross-sections, and ZPL characteristics. Key for quantum emitters and tunable lasers.',
  'https://photonics-calculators.vercel.app/materials/color-centers',
  { category: 'Materials`,
  `Point defects and impurity centers: absorption/emission spectra, cross-sections, and ZPL characteristics. Key for quantum emitters and tunable lasers.'
};


const jsonLd = generateCalculatorJsonLd(
  'Color Centers in Crystals',
  'Point defects and impurity centers: absorption/emission spectra, cross-sections, and ZPL characteristics. Key for quantum emitters and tunable lasers.',
  'https://photonics-calculators.vercel.app/materials/color-centers',
  { category: 'Materials`,
  `https://photonics-calculators.vercel.app/materials/color-centers`,
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
