import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/thin-film/sputtering-deposition' },
    title: 'Sputtering Deposition',
  description: 'Calculate sputter yield, deposition rate, thermalization, and film stress for magnetron sputtering processes.'
};
const jsonLd = generateCalculatorJsonLd(
  `Sputtering Deposition',
  description: 'Calculate sputter yield, deposition rate, thermalization, and film stress for magnetron sputtering processes.'
};


const jsonLd = generateCalculatorJsonLd(
  'Sputtering Deposition',
  'Calculate sputter yield, deposition rate, thermalization, and film stress for magnetron sputtering processes.',
  'https://photonics-calculators.vercel.app/thin-film/sputtering-deposition',
  { category: 'Thin Film`,
  `Calculate sputter yield, deposition rate, thermalization, and film stress for magnetron sputtering processes.'
};


const jsonLd = generateCalculatorJsonLd(
  'Sputtering Deposition',
  'Calculate sputter yield, deposition rate, thermalization, and film stress for magnetron sputtering processes.',
  'https://photonics-calculators.vercel.app/thin-film/sputtering-deposition',
  { category: 'Thin Film`,
  `https://photonics-calculators.vercel.app/thin-film/sputtering-deposition`,
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
