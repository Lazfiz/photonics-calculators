import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/imaging/harmonic-generation' },
    title: 'Harmonic Generation Microscopy Calculator',
  description: 'Calculate harmonic wavelengths, peak intensities, and conversion efficiencies for nonlinear harmonic generation microscopy.'
};
const jsonLd = generateCalculatorJsonLd(
  `Harmonic Generation Microscopy Calculator',
  description: 'Calculate harmonic wavelengths, peak intensities, and conversion efficiencies for nonlinear harmonic generation microscopy.'
};


const jsonLd = generateCalculatorJsonLd(
  'Harmonic Generation Microscopy Calculator',
  'Calculate harmonic wavelengths, peak intensities, and conversion efficiencies for nonlinear harmonic generation microscopy.',
  'https://photonics-calculators.vercel.app/imaging/harmonic-generation',
  { category: 'Imaging`,
  `Calculate harmonic wavelengths, peak intensities, and conversion efficiencies for nonlinear harmonic generation microscopy.'
};


const jsonLd = generateCalculatorJsonLd(
  'Harmonic Generation Microscopy Calculator',
  'Calculate harmonic wavelengths, peak intensities, and conversion efficiencies for nonlinear harmonic generation microscopy.',
  'https://photonics-calculators.vercel.app/imaging/harmonic-generation',
  { category: 'Imaging`,
  `https://photonics-calculators.vercel.app/imaging/harmonic-generation`,
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
