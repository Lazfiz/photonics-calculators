import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/fiber-optics/fiber-characterization' },
    title: 'Fiber Characterization',
  description: 'Comprehensive fiber parameter calculation: V-number, MFD, effective area, nonlinear coefficient, dispersion, and confinement.'
};
const jsonLd = generateCalculatorJsonLd(
  `Fiber Characterization',
  description: 'Comprehensive fiber parameter calculation: V-number, MFD, effective area, nonlinear coefficient, dispersion, and confinement.'
};


const jsonLd = generateCalculatorJsonLd(
  'Fiber Characterization',
  'Comprehensive fiber parameter calculation: V-number, MFD, effective area, nonlinear coefficient, dispersion, and confinement.',
  'https://photonics-calculators.vercel.app/fiber-optics/fiber-characterization',
  { category: 'Fiber Optics`,
  `Comprehensive fiber parameter calculation: V-number, MFD, effective area, nonlinear coefficient, dispersion, and confinement.'
};


const jsonLd = generateCalculatorJsonLd(
  'Fiber Characterization',
  'Comprehensive fiber parameter calculation: V-number, MFD, effective area, nonlinear coefficient, dispersion, and confinement.',
  'https://photonics-calculators.vercel.app/fiber-optics/fiber-characterization',
  { category: 'Fiber Optics`,
  `https://photonics-calculators.vercel.app/fiber-optics/fiber-characterization`,
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
