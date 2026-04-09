import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/imaging/light-sheet-microscopy' },
    title: 'Light Sheet Microscopy Design Calculator',
  description: 'Full light sheet microscope design parameters: sheet geometry, tilt geometry, and volume imaging.'
};
const jsonLd = generateCalculatorJsonLd(
  `Light Sheet Microscopy Design Calculator',
  description: 'Full light sheet microscope design parameters: sheet geometry, tilt geometry, and volume imaging.'
};


const jsonLd = generateCalculatorJsonLd(
  'Light Sheet Microscopy Design Calculator',
  'Full light sheet microscope design parameters: sheet geometry, tilt geometry, and volume imaging.',
  'https://photonics-calculators.vercel.app/imaging/light-sheet-microscopy',
  { category: 'Imaging`,
  `Full light sheet microscope design parameters: sheet geometry, tilt geometry, and volume imaging.'
};


const jsonLd = generateCalculatorJsonLd(
  'Light Sheet Microscopy Design Calculator',
  'Full light sheet microscope design parameters: sheet geometry, tilt geometry, and volume imaging.',
  'https://photonics-calculators.vercel.app/imaging/light-sheet-microscopy',
  { category: 'Imaging`,
  `https://photonics-calculators.vercel.app/imaging/light-sheet-microscopy`,
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
