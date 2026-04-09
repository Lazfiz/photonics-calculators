import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/polarization/microscope-polarizer' },
    title: 'Microscope Polarizer Calculator',
  description: 'Analyze polarization effects in microscopy: extinction, retardance sensitivity, NA degradation, and Michel-Lévy colors.'
};
const jsonLd = generateCalculatorJsonLd(
  `Microscope Polarizer Calculator',
  description: 'Analyze polarization effects in microscopy: extinction, retardance sensitivity, NA degradation, and Michel-Lévy colors.'
};


const jsonLd = generateCalculatorJsonLd(
  'Microscope Polarizer Calculator',
  'Analyze polarization effects in microscopy: extinction, retardance sensitivity, NA degradation, and Michel-Lévy colors.',
  'https://photonics-calculators.vercel.app/polarization/microscope-polarizer',
  { category: 'Polarization`,
  `Analyze polarization effects in microscopy: extinction, retardance sensitivity, NA degradation, and Michel-Lévy colors.'
};


const jsonLd = generateCalculatorJsonLd(
  'Microscope Polarizer Calculator',
  'Analyze polarization effects in microscopy: extinction, retardance sensitivity, NA degradation, and Michel-Lévy colors.',
  'https://photonics-calculators.vercel.app/polarization/microscope-polarizer',
  { category: 'Polarization`,
  `https://photonics-calculators.vercel.app/polarization/microscope-polarizer`,
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
