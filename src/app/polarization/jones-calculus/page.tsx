import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/polarization/jones-calculus' },
    title: 'Jones Calculus',
  description: 'Chain Jones matrices for polarizers, waveplates, and rotators. Up to 5 elements.'
};
const jsonLd = generateCalculatorJsonLd(
  `Jones Calculus',
  description: 'Chain Jones matrices for polarizers, waveplates, and rotators. Up to 5 elements.'
};


const jsonLd = generateCalculatorJsonLd(
  'Jones Calculus',
  'Chain Jones matrices for polarizers, waveplates, and rotators. Up to 5 elements.',
  'https://photonics-calculators.vercel.app/polarization/jones-calculus',
  { category: 'Polarization`,
  `Chain Jones matrices for polarizers, waveplates, and rotators. Up to 5 elements.'
};


const jsonLd = generateCalculatorJsonLd(
  'Jones Calculus',
  'Chain Jones matrices for polarizers, waveplates, and rotators. Up to 5 elements.',
  'https://photonics-calculators.vercel.app/polarization/jones-calculus',
  { category: 'Polarization`,
  `https://photonics-calculators.vercel.app/polarization/jones-calculus`,
  { category: `Polarization` }
);
export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}
