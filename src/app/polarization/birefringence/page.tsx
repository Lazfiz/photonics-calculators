import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/polarization/birefringence' },
    title: 'Birefringence & Retardation',
  description: 'Phase retardation from crystal birefringence, thickness, and wavelength.'
};
const jsonLd = generateCalculatorJsonLd(
  `Birefringence & Retardation',
  description: 'Phase retardation from crystal birefringence, thickness, and wavelength.'
};


const jsonLd = generateCalculatorJsonLd(
  'Birefringence & Retardation',
  'Phase retardation from crystal birefringence, thickness, and wavelength.',
  'https://photonics-calculators.vercel.app/polarization/birefringence',
  { category: 'Polarization`,
  `Phase retardation from crystal birefringence, thickness, and wavelength.'
};


const jsonLd = generateCalculatorJsonLd(
  'Birefringence & Retardation',
  'Phase retardation from crystal birefringence, thickness, and wavelength.',
  'https://photonics-calculators.vercel.app/polarization/birefringence',
  { category: 'Polarization`,
  `https://photonics-calculators.vercel.app/polarization/birefringence`,
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
