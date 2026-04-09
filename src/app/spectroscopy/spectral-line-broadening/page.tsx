import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/spectroscopy/spectral-line-broadening' },
    title: 'Spectral Line Broadening',
  description: 'Doppler, collisional, natural, and Voigt broadening mechanisms.'
};
const jsonLd = generateCalculatorJsonLd(
  `Spectral Line Broadening',
  description: 'Doppler, collisional, natural, and Voigt broadening mechanisms.'
};


const jsonLd = generateCalculatorJsonLd(
  'Spectral Line Broadening',
  'Doppler, collisional, natural, and Voigt broadening mechanisms.',
  'https://photonics-calculators.vercel.app/spectroscopy/spectral-line-broadening',
  { category: 'Spectroscopy`,
  `Doppler, collisional, natural, and Voigt broadening mechanisms.'
};


const jsonLd = generateCalculatorJsonLd(
  'Spectral Line Broadening',
  'Doppler, collisional, natural, and Voigt broadening mechanisms.',
  'https://photonics-calculators.vercel.app/spectroscopy/spectral-line-broadening',
  { category: 'Spectroscopy`,
  `https://photonics-calculators.vercel.app/spectroscopy/spectral-line-broadening`,
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
