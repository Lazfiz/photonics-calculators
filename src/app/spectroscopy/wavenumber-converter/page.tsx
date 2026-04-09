import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/spectroscopy/wavenumber-converter' },
    title: 'Wavenumber Converter',
  description: 'Convert wavelength, wavenumber, frequency, and energy with sliders, presets, and range sweeps.'
};
const jsonLd = generateCalculatorJsonLd(
  `Wavenumber Converter',
  description: 'Convert wavelength, wavenumber, frequency, and energy with sliders, presets, and range sweeps.'
};


const jsonLd = generateCalculatorJsonLd(
  'Wavenumber Converter',
  'Convert wavelength, wavenumber, frequency, and energy with sliders, presets, and range sweeps.',
  'https://photonics-calculators.vercel.app/spectroscopy/wavenumber-converter',
  { category: 'Spectroscopy`,
  `Convert wavelength, wavenumber, frequency, and energy with sliders, presets, and range sweeps.'
};


const jsonLd = generateCalculatorJsonLd(
  'Wavenumber Converter',
  'Convert wavelength, wavenumber, frequency, and energy with sliders, presets, and range sweeps.',
  'https://photonics-calculators.vercel.app/spectroscopy/wavenumber-converter',
  { category: 'Spectroscopy`,
  `https://photonics-calculators.vercel.app/spectroscopy/wavenumber-converter`,
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
