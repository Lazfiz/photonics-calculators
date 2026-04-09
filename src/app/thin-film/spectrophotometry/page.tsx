import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/thin-film/spectrophotometry' },
    title: 'Spectrophotometry',
  description: 'Model spectrophotometric R, T, A spectra for a single absorbing thin film using transfer matrix method with complex refractive index.'
};
const jsonLd = generateCalculatorJsonLd(
  `Spectrophotometry',
  description: 'Model spectrophotometric R, T, A spectra for a single absorbing thin film using transfer matrix method with complex refractive index.'
};


const jsonLd = generateCalculatorJsonLd(
  'Spectrophotometry',
  'Model spectrophotometric R, T, A spectra for a single absorbing thin film using transfer matrix method with complex refractive index.',
  'https://photonics-calculators.vercel.app/thin-film/spectrophotometry',
  { category: 'Thin Film`,
  `Model spectrophotometric R, T, A spectra for a single absorbing thin film using transfer matrix method with complex refractive index.'
};


const jsonLd = generateCalculatorJsonLd(
  'Spectrophotometry',
  'Model spectrophotometric R, T, A spectra for a single absorbing thin film using transfer matrix method with complex refractive index.',
  'https://photonics-calculators.vercel.app/thin-film/spectrophotometry',
  { category: 'Thin Film`,
  `https://photonics-calculators.vercel.app/thin-film/spectrophotometry`,
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
