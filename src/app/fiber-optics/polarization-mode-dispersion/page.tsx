import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/fiber-optics/polarization-mode-dispersion' },
    title: 'Polarization Mode Dispersion (PMD)',
  description: 'Calculate PMD-induced differential group delay (DGD), system penalties, and PMD-limited reach using Maxwellian statistics.'
};
const jsonLd = generateCalculatorJsonLd(
  `Polarization Mode Dispersion (PMD)',
  description: 'Calculate PMD-induced differential group delay (DGD), system penalties, and PMD-limited reach using Maxwellian statistics.'
};


const jsonLd = generateCalculatorJsonLd(
  'Polarization Mode Dispersion (PMD)',
  'Calculate PMD-induced differential group delay (DGD), system penalties, and PMD-limited reach using Maxwellian statistics.',
  'https://photonics-calculators.vercel.app/fiber-optics/polarization-mode-dispersion',
  { category: 'Fiber Optics`,
  `Calculate PMD-induced differential group delay (DGD), system penalties, and PMD-limited reach using Maxwellian statistics.'
};


const jsonLd = generateCalculatorJsonLd(
  'Polarization Mode Dispersion (PMD)',
  'Calculate PMD-induced differential group delay (DGD), system penalties, and PMD-limited reach using Maxwellian statistics.',
  'https://photonics-calculators.vercel.app/fiber-optics/polarization-mode-dispersion',
  { category: 'Fiber Optics`,
  `https://photonics-calculators.vercel.app/fiber-optics/polarization-mode-dispersion`,
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
