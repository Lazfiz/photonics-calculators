import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/thin-film/narrow-bandpass' },
    title: 'Narrow Bandpass Filter',
  description: 'High-finesse Fabry-Perot with multiple cavities for ultra-narrow transmission peaks.'
};
const jsonLd = generateCalculatorJsonLd(
  `Narrow Bandpass Filter',
  description: 'High-finesse Fabry-Perot with multiple cavities for ultra-narrow transmission peaks.'
};


const jsonLd = generateCalculatorJsonLd(
  'Narrow Bandpass Filter',
  'High-finesse Fabry-Perot with multiple cavities for ultra-narrow transmission peaks.',
  'https://photonics-calculators.vercel.app/thin-film/narrow-bandpass',
  { category: 'Thin Film`,
  `High-finesse Fabry-Perot with multiple cavities for ultra-narrow transmission peaks.'
};


const jsonLd = generateCalculatorJsonLd(
  'Narrow Bandpass Filter',
  'High-finesse Fabry-Perot with multiple cavities for ultra-narrow transmission peaks.',
  'https://photonics-calculators.vercel.app/thin-film/narrow-bandpass',
  { category: 'Thin Film`,
  `https://photonics-calculators.vercel.app/thin-film/narrow-bandpass`,
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
