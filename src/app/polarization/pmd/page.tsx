import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/polarization/pmd' },
    title: 'Polarization Mode Dispersion',
  description: 'Calculate PMD-induced DGD, Maxwellian statistics, and system penalties.'
};
const jsonLd = generateCalculatorJsonLd(
  `Polarization Mode Dispersion',
  description: 'Calculate PMD-induced DGD, Maxwellian statistics, and system penalties.'
};


const jsonLd = generateCalculatorJsonLd(
  'Polarization Mode Dispersion',
  'Calculate PMD-induced DGD, Maxwellian statistics, and system penalties.',
  'https://photonics-calculators.vercel.app/polarization/pmd',
  { category: 'Polarization`,
  `Calculate PMD-induced DGD, Maxwellian statistics, and system penalties.'
};


const jsonLd = generateCalculatorJsonLd(
  'Polarization Mode Dispersion',
  'Calculate PMD-induced DGD, Maxwellian statistics, and system penalties.',
  'https://photonics-calculators.vercel.app/polarization/pmd',
  { category: 'Polarization`,
  `https://photonics-calculators.vercel.app/polarization/pmd`,
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
