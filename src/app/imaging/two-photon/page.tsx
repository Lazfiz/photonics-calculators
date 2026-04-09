import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/imaging/two-photon' },
    title: 'Two-Photon Microscopy Calculator',
  description: 'Excitation wavelength, resolution, and pulse parameters for two-photon fluorescence microscopy.'
};
const jsonLd = generateCalculatorJsonLd(
  `Two-Photon Microscopy Calculator',
  description: 'Excitation wavelength, resolution, and pulse parameters for two-photon fluorescence microscopy.'
};


const jsonLd = generateCalculatorJsonLd(
  'Two-Photon Microscopy Calculator',
  'Excitation wavelength, resolution, and pulse parameters for two-photon fluorescence microscopy.',
  'https://photonics-calculators.vercel.app/imaging/two-photon',
  { category: 'Imaging`,
  `Excitation wavelength, resolution, and pulse parameters for two-photon fluorescence microscopy.'
};


const jsonLd = generateCalculatorJsonLd(
  'Two-Photon Microscopy Calculator',
  'Excitation wavelength, resolution, and pulse parameters for two-photon fluorescence microscopy.',
  'https://photonics-calculators.vercel.app/imaging/two-photon',
  { category: 'Imaging`,
  `https://photonics-calculators.vercel.app/imaging/two-photon`,
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
