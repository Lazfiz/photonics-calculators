import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/imaging/fluorescence-spectra' },
    title: 'Fluorescence Spectra Overlap Calculator',
  description: 'Compare excitation/emission spectra, spectral overlap, and filter crosstalk.'
};
const jsonLd = generateCalculatorJsonLd(
  `Fluorescence Spectra Overlap Calculator',
  description: 'Compare excitation/emission spectra, spectral overlap, and filter crosstalk.'
};


const jsonLd = generateCalculatorJsonLd(
  'Fluorescence Spectra Overlap Calculator',
  'Compare excitation/emission spectra, spectral overlap, and filter crosstalk.',
  'https://photonics-calculators.vercel.app/imaging/fluorescence-spectra',
  { category: 'Imaging`,
  `Compare excitation/emission spectra, spectral overlap, and filter crosstalk.'
};


const jsonLd = generateCalculatorJsonLd(
  'Fluorescence Spectra Overlap Calculator',
  'Compare excitation/emission spectra, spectral overlap, and filter crosstalk.',
  'https://photonics-calculators.vercel.app/imaging/fluorescence-spectra',
  { category: 'Imaging`,
  `https://photonics-calculators.vercel.app/imaging/fluorescence-spectra`,
  { category: `Imaging` }
);
export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}
