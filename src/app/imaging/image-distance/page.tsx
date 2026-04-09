import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/imaging/image-distance' },
    title: 'Thin Lens Image Distance',
  description: 'Calculate image distance, magnification, and conjugate ratio for a thin lens.'
};
const jsonLd = generateCalculatorJsonLd(
  `Thin Lens Image Distance',
  description: 'Calculate image distance, magnification, and conjugate ratio for a thin lens.'
};


const jsonLd = generateCalculatorJsonLd(
  'Thin Lens Image Distance',
  'Calculate image distance, magnification, and conjugate ratio for a thin lens.',
  'https://photonics-calculators.vercel.app/imaging/image-distance',
  { category: 'Imaging`,
  `Calculate image distance, magnification, and conjugate ratio for a thin lens.'
};


const jsonLd = generateCalculatorJsonLd(
  'Thin Lens Image Distance',
  'Calculate image distance, magnification, and conjugate ratio for a thin lens.',
  'https://photonics-calculators.vercel.app/imaging/image-distance',
  { category: 'Imaging`,
  `https://photonics-calculators.vercel.app/imaging/image-distance`,
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
