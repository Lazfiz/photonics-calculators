import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/imaging/hyperspectral-microscopy' },
    title: 'Hyperspectral Microscopy',
  description: 'Configure hyperspectral data cubes: spectral range, bands, data size, acquisition time, and SNR tradeoffs.'
};
const jsonLd = generateCalculatorJsonLd(
  `Hyperspectral Microscopy',
  description: 'Configure hyperspectral data cubes: spectral range, bands, data size, acquisition time, and SNR tradeoffs.'
};


const jsonLd = generateCalculatorJsonLd(
  'Hyperspectral Microscopy',
  'Configure hyperspectral data cubes: spectral range, bands, data size, acquisition time, and SNR tradeoffs.',
  'https://photonics-calculators.vercel.app/imaging/hyperspectral-microscopy',
  { category: 'Imaging`,
  `Configure hyperspectral data cubes: spectral range, bands, data size, acquisition time, and SNR tradeoffs.'
};


const jsonLd = generateCalculatorJsonLd(
  'Hyperspectral Microscopy',
  'Configure hyperspectral data cubes: spectral range, bands, data size, acquisition time, and SNR tradeoffs.',
  'https://photonics-calculators.vercel.app/imaging/hyperspectral-microscopy',
  { category: 'Imaging`,
  `https://photonics-calculators.vercel.app/imaging/hyperspectral-microscopy`,
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
