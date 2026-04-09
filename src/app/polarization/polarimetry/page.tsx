import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/polarization/polarimetry' },
    title: 'Polarimetry Basics',
  description: 'Explore Stokes parameters, Poincaré sphere representation, and analyzer measurements for polarization state characterization.'
};
const jsonLd = generateCalculatorJsonLd(
  `Polarimetry Basics',
  description: 'Explore Stokes parameters, Poincaré sphere representation, and analyzer measurements for polarization state characterization.'
};


const jsonLd = generateCalculatorJsonLd(
  'Polarimetry Basics',
  'Explore Stokes parameters, Poincaré sphere representation, and analyzer measurements for polarization state characterization.',
  'https://photonics-calculators.vercel.app/polarization/polarimetry',
  { category: 'Polarization`,
  `Explore Stokes parameters, Poincaré sphere representation, and analyzer measurements for polarization state characterization.'
};


const jsonLd = generateCalculatorJsonLd(
  'Polarimetry Basics',
  'Explore Stokes parameters, Poincaré sphere representation, and analyzer measurements for polarization state characterization.',
  'https://photonics-calculators.vercel.app/polarization/polarimetry',
  { category: 'Polarization`,
  `https://photonics-calculators.vercel.app/polarization/polarimetry`,
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
