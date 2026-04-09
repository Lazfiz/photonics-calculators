import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/spectroscopy/resolution' },
    title: 'Spectral Resolution',
  description: 'Resolving power and minimum resolvable wavelength for a diffraction grating spectrometer.'
};
const jsonLd = generateCalculatorJsonLd(
  `Spectral Resolution',
  description: 'Resolving power and minimum resolvable wavelength for a diffraction grating spectrometer.'
};


const jsonLd = generateCalculatorJsonLd(
  'Spectral Resolution',
  'Resolving power and minimum resolvable wavelength for a diffraction grating spectrometer.',
  'https://photonics-calculators.vercel.app/spectroscopy/resolution',
  { category: 'Spectroscopy`,
  `Resolving power and minimum resolvable wavelength for a diffraction grating spectrometer.'
};


const jsonLd = generateCalculatorJsonLd(
  'Spectral Resolution',
  'Resolving power and minimum resolvable wavelength for a diffraction grating spectrometer.',
  'https://photonics-calculators.vercel.app/spectroscopy/resolution',
  { category: 'Spectroscopy`,
  `https://photonics-calculators.vercel.app/spectroscopy/resolution`,
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
