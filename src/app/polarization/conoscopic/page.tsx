import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/polarization/conoscopic' },
    title: 'Conoscopic Observation',
  description: 'Simulate conoscopic interference figures (isochromates and isogyres) for uniaxial and biaxial crystals between crossed polarizers.'
};
const jsonLd = generateCalculatorJsonLd(
  `Conoscopic Observation',
  description: 'Simulate conoscopic interference figures (isochromates and isogyres) for uniaxial and biaxial crystals between crossed polarizers.'
};


const jsonLd = generateCalculatorJsonLd(
  'Conoscopic Observation',
  'Simulate conoscopic interference figures (isochromates and isogyres) for uniaxial and biaxial crystals between crossed polarizers.',
  'https://photonics-calculators.vercel.app/polarization/conoscopic',
  { category: 'Polarization`,
  `Simulate conoscopic interference figures (isochromates and isogyres) for uniaxial and biaxial crystals between crossed polarizers.'
};


const jsonLd = generateCalculatorJsonLd(
  'Conoscopic Observation',
  'Simulate conoscopic interference figures (isochromates and isogyres) for uniaxial and biaxial crystals between crossed polarizers.',
  'https://photonics-calculators.vercel.app/polarization/conoscopic',
  { category: 'Polarization`,
  `https://photonics-calculators.vercel.app/polarization/conoscopic`,
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
