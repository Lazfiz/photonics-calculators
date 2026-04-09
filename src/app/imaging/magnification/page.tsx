import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/imaging/magnification' },
    title: 'Total Magnification Calculator',
  description: 'Calculate total system magnification from objective, tube lens, and camera adapter lens.'
};
const jsonLd = generateCalculatorJsonLd(
  `Total Magnification Calculator',
  description: 'Calculate total system magnification from objective, tube lens, and camera adapter lens.'
};


const jsonLd = generateCalculatorJsonLd(
  'Total Magnification Calculator',
  'Calculate total system magnification from objective, tube lens, and camera adapter lens.',
  'https://photonics-calculators.vercel.app/imaging/magnification',
  { category: 'Imaging`,
  `Calculate total system magnification from objective, tube lens, and camera adapter lens.'
};


const jsonLd = generateCalculatorJsonLd(
  'Total Magnification Calculator',
  'Calculate total system magnification from objective, tube lens, and camera adapter lens.',
  'https://photonics-calculators.vercel.app/imaging/magnification',
  { category: 'Imaging`,
  `https://photonics-calculators.vercel.app/imaging/magnification`,
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
