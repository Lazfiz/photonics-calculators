import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/imaging/sum-frequency-microscopy' },
    title: 'Sum-Frequency Generation Microscopy Calculator',
  description: 'Calculate SFG wavelengths, energies, and beam parameters for sum-frequency generation microscopy.'
};
const jsonLd = generateCalculatorJsonLd(
  `Sum-Frequency Generation Microscopy Calculator',
  description: 'Calculate SFG wavelengths, energies, and beam parameters for sum-frequency generation microscopy.'
};


const jsonLd = generateCalculatorJsonLd(
  'Sum-Frequency Generation Microscopy Calculator',
  'Calculate SFG wavelengths, energies, and beam parameters for sum-frequency generation microscopy.',
  'https://photonics-calculators.vercel.app/imaging/sum-frequency-microscopy',
  { category: 'Imaging`,
  `Calculate SFG wavelengths, energies, and beam parameters for sum-frequency generation microscopy.'
};


const jsonLd = generateCalculatorJsonLd(
  'Sum-Frequency Generation Microscopy Calculator',
  'Calculate SFG wavelengths, energies, and beam parameters for sum-frequency generation microscopy.',
  'https://photonics-calculators.vercel.app/imaging/sum-frequency-microscopy',
  { category: 'Imaging`,
  `https://photonics-calculators.vercel.app/imaging/sum-frequency-microscopy`,
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
