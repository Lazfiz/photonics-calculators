import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/laser-safety/multiple-wavelength' },
      title: 'Multiple Wavelength MPE',
  description: 'Calculates additive hazard ratios for multiple laser wavelengths. Sum of ratios must be < 1 for safety per ANSI Z136.1 Section 8.',
};
const jsonLd = generateCalculatorJsonLd(
  `Multiple Wavelength MPE',
  description: 'Calculates additive hazard ratios for multiple laser wavelengths. Sum of ratios must be < 1 for safety per ANSI Z136.1 Section 8.',
};


const jsonLd = generateCalculatorJsonLd(
  'Multiple Wavelength MPE',
  'Calculates additive hazard ratios for multiple laser wavelengths. Sum of ratios must be < 1 for safety per ANSI Z136.1 Section 8.',
  'https://photonics-calculators.vercel.app/laser-safety/multiple-wavelength',
  { category: 'Laser Safety`,
  `Calculates additive hazard ratios for multiple laser wavelengths. Sum of ratios must be < 1 for safety per ANSI Z136.1 Section 8.',
};


const jsonLd = generateCalculatorJsonLd(
  'Multiple Wavelength MPE',
  'Calculates additive hazard ratios for multiple laser wavelengths. Sum of ratios must be < 1 for safety per ANSI Z136.1 Section 8.',
  'https://photonics-calculators.vercel.app/laser-safety/multiple-wavelength',
  { category: 'Laser Safety`,
  `https://photonics-calculators.vercel.app/laser-safety/multiple-wavelength`,
  { category: `Laser Safety` }
);
export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}
