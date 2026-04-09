import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/spectroscopy/spectral-calibration' },
    title: 'Spectral Calibration',
  description: 'Wavelength calibration using known emission lines and linear/polynomial fitting.'
};
const jsonLd = generateCalculatorJsonLd(
  `Spectral Calibration',
  description: 'Wavelength calibration using known emission lines and linear/polynomial fitting.'
};


const jsonLd = generateCalculatorJsonLd(
  'Spectral Calibration',
  'Wavelength calibration using known emission lines and linear/polynomial fitting.',
  'https://photonics-calculators.vercel.app/spectroscopy/spectral-calibration',
  { category: 'Spectroscopy`,
  `Wavelength calibration using known emission lines and linear/polynomial fitting.'
};


const jsonLd = generateCalculatorJsonLd(
  'Spectral Calibration',
  'Wavelength calibration using known emission lines and linear/polynomial fitting.',
  'https://photonics-calculators.vercel.app/spectroscopy/spectral-calibration',
  { category: 'Spectroscopy`,
  `https://photonics-calculators.vercel.app/spectroscopy/spectral-calibration`,
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
