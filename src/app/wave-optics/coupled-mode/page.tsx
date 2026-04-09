import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/wave-optics/coupled-mode' },
    title: 'Coupled Mode Theory',
  description: 'Power exchange between two coupled waveguides.'
};
const jsonLd = generateCalculatorJsonLd(
  `Coupled Mode Theory',
  description: 'Power exchange between two coupled waveguides.'
};


const jsonLd = generateCalculatorJsonLd(
  'Coupled Mode Theory',
  'Power exchange between two coupled waveguides.',
  'https://photonics-calculators.vercel.app/wave-optics/coupled-mode',
  { category: 'Wave Optics`,
  `Power exchange between two coupled waveguides.'
};


const jsonLd = generateCalculatorJsonLd(
  'Coupled Mode Theory',
  'Power exchange between two coupled waveguides.',
  'https://photonics-calculators.vercel.app/wave-optics/coupled-mode',
  { category: 'Wave Optics`,
  `https://photonics-calculators.vercel.app/wave-optics/coupled-mode`,
  { category: `Wave Optics` }
);
export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}
