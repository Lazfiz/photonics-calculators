import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/polarization/depolarization' },
    title: 'Depolarization',
  description: 'Calculate depolarization effects via Mueller matrix model or spectral averaging.'
};
const jsonLd = generateCalculatorJsonLd(
  `Depolarization',
  description: 'Calculate depolarization effects via Mueller matrix model or spectral averaging.'
};


const jsonLd = generateCalculatorJsonLd(
  'Depolarization',
  'Calculate depolarization effects via Mueller matrix model or spectral averaging.',
  'https://photonics-calculators.vercel.app/polarization/depolarization',
  { category: 'Polarization`,
  `Calculate depolarization effects via Mueller matrix model or spectral averaging.'
};


const jsonLd = generateCalculatorJsonLd(
  'Depolarization',
  'Calculate depolarization effects via Mueller matrix model or spectral averaging.',
  'https://photonics-calculators.vercel.app/polarization/depolarization',
  { category: 'Polarization`,
  `https://photonics-calculators.vercel.app/polarization/depolarization`,
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
