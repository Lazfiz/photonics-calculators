import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/spectroscopy/grating-efficiency' },
    title: 'Grating Efficiency Calculator',
  description: 'Estimate diffraction grating efficiency based on groove density, blaze angle, and wavelength.'
};
const jsonLd = generateCalculatorJsonLd(
  `Grating Efficiency Calculator',
  description: 'Estimate diffraction grating efficiency based on groove density, blaze angle, and wavelength.'
};


const jsonLd = generateCalculatorJsonLd(
  'Grating Efficiency Calculator',
  'Estimate diffraction grating efficiency based on groove density, blaze angle, and wavelength.',
  'https://photonics-calculators.vercel.app/spectroscopy/grating-efficiency',
  { category: 'Spectroscopy`,
  `Estimate diffraction grating efficiency based on groove density, blaze angle, and wavelength.'
};


const jsonLd = generateCalculatorJsonLd(
  'Grating Efficiency Calculator',
  'Estimate diffraction grating efficiency based on groove density, blaze angle, and wavelength.',
  'https://photonics-calculators.vercel.app/spectroscopy/grating-efficiency',
  { category: 'Spectroscopy`,
  `https://photonics-calculators.vercel.app/spectroscopy/grating-efficiency`,
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
