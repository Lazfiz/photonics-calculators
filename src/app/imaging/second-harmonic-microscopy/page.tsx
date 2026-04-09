import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/imaging/second-harmonic-microscopy' },
    title: 'Second-Harmonic Generation Microscopy Calculator',
  description: 'Calculate SHG wavelength, resolution, phase matching, and signal strength for SHG microscopy of collagen, muscle, and other non-centrosymmetric structures.'
};
const jsonLd = generateCalculatorJsonLd(
  `Second-Harmonic Generation Microscopy Calculator',
  description: 'Calculate SHG wavelength, resolution, phase matching, and signal strength for SHG microscopy of collagen, muscle, and other non-centrosymmetric structures.'
};


const jsonLd = generateCalculatorJsonLd(
  'Second-Harmonic Generation Microscopy Calculator',
  'Calculate SHG wavelength, resolution, phase matching, and signal strength for SHG microscopy of collagen, muscle, and other non-centrosymmetric structures.',
  'https://photonics-calculators.vercel.app/imaging/second-harmonic-microscopy',
  { category: 'Imaging`,
  `Calculate SHG wavelength, resolution, phase matching, and signal strength for SHG microscopy of collagen, muscle, and other non-centrosymmetric structures.'
};


const jsonLd = generateCalculatorJsonLd(
  'Second-Harmonic Generation Microscopy Calculator',
  'Calculate SHG wavelength, resolution, phase matching, and signal strength for SHG microscopy of collagen, muscle, and other non-centrosymmetric structures.',
  'https://photonics-calculators.vercel.app/imaging/second-harmonic-microscopy',
  { category: 'Imaging`,
  `https://photonics-calculators.vercel.app/imaging/second-harmonic-microscopy`,
  { category: `Imaging` }
);
export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}
