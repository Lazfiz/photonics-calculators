import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/imaging/working-distance' },
    title: 'Working Distance Calculator',
  description: 'Calculate working distance from objective focal length and magnification.'
};
const jsonLd = generateCalculatorJsonLd(
  `Working Distance Calculator',
  description: 'Calculate working distance from objective focal length and magnification.'
};


const jsonLd = generateCalculatorJsonLd(
  'Working Distance Calculator',
  'Calculate working distance from objective focal length and magnification.',
  'https://photonics-calculators.vercel.app/imaging/working-distance',
  { category: 'Imaging`,
  `Calculate working distance from objective focal length and magnification.'
};


const jsonLd = generateCalculatorJsonLd(
  'Working Distance Calculator',
  'Calculate working distance from objective focal length and magnification.',
  'https://photonics-calculators.vercel.app/imaging/working-distance',
  { category: 'Imaging`,
  `https://photonics-calculators.vercel.app/imaging/working-distance`,
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
