import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/spectroscopy/spectral-range' },
    title: 'Spectral Range Calculator',
  description: 'Spectral coverage, resolution, and dispersion for a grating-based spectrometer.'
};
const jsonLd = generateCalculatorJsonLd(
  `Spectral Range Calculator',
  description: 'Spectral coverage, resolution, and dispersion for a grating-based spectrometer.'
};


const jsonLd = generateCalculatorJsonLd(
  'Spectral Range Calculator',
  'Spectral coverage, resolution, and dispersion for a grating-based spectrometer.',
  'https://photonics-calculators.vercel.app/spectroscopy/spectral-range',
  { category: 'Spectroscopy`,
  `Spectral coverage, resolution, and dispersion for a grating-based spectrometer.'
};


const jsonLd = generateCalculatorJsonLd(
  'Spectral Range Calculator',
  'Spectral coverage, resolution, and dispersion for a grating-based spectrometer.',
  'https://photonics-calculators.vercel.app/spectroscopy/spectral-range',
  { category: 'Spectroscopy`,
  `https://photonics-calculators.vercel.app/spectroscopy/spectral-range`,
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
