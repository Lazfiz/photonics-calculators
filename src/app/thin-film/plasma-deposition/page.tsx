import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/thin-film/plasma-deposition' },
    title: 'Plasma Deposition',
  description: 'Model plasma-enhanced deposition parameters: electron temperature, ion density, sheath voltage, and deposition rate.'
};
const jsonLd = generateCalculatorJsonLd(
  `Plasma Deposition',
  description: 'Model plasma-enhanced deposition parameters: electron temperature, ion density, sheath voltage, and deposition rate.'
};


const jsonLd = generateCalculatorJsonLd(
  'Plasma Deposition',
  'Model plasma-enhanced deposition parameters: electron temperature, ion density, sheath voltage, and deposition rate.',
  'https://photonics-calculators.vercel.app/thin-film/plasma-deposition',
  { category: 'Thin Film`,
  `Model plasma-enhanced deposition parameters: electron temperature, ion density, sheath voltage, and deposition rate.'
};


const jsonLd = generateCalculatorJsonLd(
  'Plasma Deposition',
  'Model plasma-enhanced deposition parameters: electron temperature, ion density, sheath voltage, and deposition rate.',
  'https://photonics-calculators.vercel.app/thin-film/plasma-deposition',
  { category: 'Thin Film`,
  `https://photonics-calculators.vercel.app/thin-film/plasma-deposition`,
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
