import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/thin-film/bandpass-filter' },
    title: 'Bandpass Filter',
  description: 'Fabry-Perot bandpass — multi-cavity design with quarter-wave mirrors and half-wave spacers.'
};
const jsonLd = generateCalculatorJsonLd(
  `Bandpass Filter',
  description: 'Fabry-Perot bandpass — multi-cavity design with quarter-wave mirrors and half-wave spacers.'
};


const jsonLd = generateCalculatorJsonLd(
  'Bandpass Filter',
  'Fabry-Perot bandpass — multi-cavity design with quarter-wave mirrors and half-wave spacers.',
  'https://photonics-calculators.vercel.app/thin-film/bandpass-filter',
  { category: 'Thin Film`,
  `Fabry-Perot bandpass — multi-cavity design with quarter-wave mirrors and half-wave spacers.'
};


const jsonLd = generateCalculatorJsonLd(
  'Bandpass Filter',
  'Fabry-Perot bandpass — multi-cavity design with quarter-wave mirrors and half-wave spacers.',
  'https://photonics-calculators.vercel.app/thin-film/bandpass-filter',
  { category: 'Thin Film`,
  `https://photonics-calculators.vercel.app/thin-film/bandpass-filter`,
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
