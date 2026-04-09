import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/fiber-optics/macro-bend' },
    title: 'Macro Bend Loss',
  description: 'Detailed macrobending loss calculation for single-mode fibers based on bend radius and wavelength.'
};
const jsonLd = generateCalculatorJsonLd(
  `Macro Bend Loss',
  description: 'Detailed macrobending loss calculation for single-mode fibers based on bend radius and wavelength.'
};


const jsonLd = generateCalculatorJsonLd(
  'Macro Bend Loss',
  'Detailed macrobending loss calculation for single-mode fibers based on bend radius and wavelength.',
  'https://photonics-calculators.vercel.app/fiber-optics/macro-bend',
  { category: 'Fiber Optics`,
  `Detailed macrobending loss calculation for single-mode fibers based on bend radius and wavelength.'
};


const jsonLd = generateCalculatorJsonLd(
  'Macro Bend Loss',
  'Detailed macrobending loss calculation for single-mode fibers based on bend radius and wavelength.',
  'https://photonics-calculators.vercel.app/fiber-optics/macro-bend',
  { category: 'Fiber Optics`,
  `https://photonics-calculators.vercel.app/fiber-optics/macro-bend`,
  { category: `Fiber Optics` }
);
export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}
