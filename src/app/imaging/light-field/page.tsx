import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/imaging/light-field' },
    title: 'Light Field Microscopy',
  description: 'Angular resolution, spatial-angular tradeoff, and synthetic aperture parameters.'
};
const jsonLd = generateCalculatorJsonLd(
  `Light Field Microscopy',
  description: 'Angular resolution, spatial-angular tradeoff, and synthetic aperture parameters.'
};


const jsonLd = generateCalculatorJsonLd(
  'Light Field Microscopy',
  'Angular resolution, spatial-angular tradeoff, and synthetic aperture parameters.',
  'https://photonics-calculators.vercel.app/imaging/light-field',
  { category: 'Imaging`,
  `Angular resolution, spatial-angular tradeoff, and synthetic aperture parameters.'
};


const jsonLd = generateCalculatorJsonLd(
  'Light Field Microscopy',
  'Angular resolution, spatial-angular tradeoff, and synthetic aperture parameters.',
  'https://photonics-calculators.vercel.app/imaging/light-field',
  { category: 'Imaging`,
  `https://photonics-calculators.vercel.app/imaging/light-field`,
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
