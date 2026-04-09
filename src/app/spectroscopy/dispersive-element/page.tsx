import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/spectroscopy/dispersive-element' },
    title: 'Dispersive Element Design',
  description: 'Diffraction grating parameters: grating equation, angular/linear dispersion, blaze profile.'
};
const jsonLd = generateCalculatorJsonLd(
  `Dispersive Element Design',
  description: 'Diffraction grating parameters: grating equation, angular/linear dispersion, blaze profile.'
};


const jsonLd = generateCalculatorJsonLd(
  'Dispersive Element Design',
  'Diffraction grating parameters: grating equation, angular/linear dispersion, blaze profile.',
  'https://photonics-calculators.vercel.app/spectroscopy/dispersive-element',
  { category: 'Spectroscopy`,
  `Diffraction grating parameters: grating equation, angular/linear dispersion, blaze profile.'
};


const jsonLd = generateCalculatorJsonLd(
  'Dispersive Element Design',
  'Diffraction grating parameters: grating equation, angular/linear dispersion, blaze profile.',
  'https://photonics-calculators.vercel.app/spectroscopy/dispersive-element',
  { category: 'Spectroscopy`,
  `https://photonics-calculators.vercel.app/spectroscopy/dispersive-element`,
  { category: `Spectroscopy` }
);
export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}
