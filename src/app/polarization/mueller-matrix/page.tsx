import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/polarization/mueller-matrix' },
    title: 'Mueller Matrix Calculator',
  description: 'Chain optical elements using Mueller matrices and compute output Stokes vector.'
};
const jsonLd = generateCalculatorJsonLd(
  `Mueller Matrix Calculator',
  description: 'Chain optical elements using Mueller matrices and compute output Stokes vector.'
};


const jsonLd = generateCalculatorJsonLd(
  'Mueller Matrix Calculator',
  'Chain optical elements using Mueller matrices and compute output Stokes vector.',
  'https://photonics-calculators.vercel.app/polarization/mueller-matrix',
  { category: 'Polarization`,
  `Chain optical elements using Mueller matrices and compute output Stokes vector.'
};


const jsonLd = generateCalculatorJsonLd(
  'Mueller Matrix Calculator',
  'Chain optical elements using Mueller matrices and compute output Stokes vector.',
  'https://photonics-calculators.vercel.app/polarization/mueller-matrix',
  { category: 'Polarization`,
  `https://photonics-calculators.vercel.app/polarization/mueller-matrix`,
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
