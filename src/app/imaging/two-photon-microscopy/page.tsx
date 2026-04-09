import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/imaging/two-photon-microscopy' },
    title: 'Two-Photon Microscopy Calculator',
  description: 'Calculate resolution, excitation volume, peak intensity, and depth penetration for two-photon fluorescence microscopy.'
};
const jsonLd = generateCalculatorJsonLd(
  `Two-Photon Microscopy Calculator',
  description: 'Calculate resolution, excitation volume, peak intensity, and depth penetration for two-photon fluorescence microscopy.'
};


const jsonLd = generateCalculatorJsonLd(
  'Two-Photon Microscopy Calculator',
  'Calculate resolution, excitation volume, peak intensity, and depth penetration for two-photon fluorescence microscopy.',
  'https://photonics-calculators.vercel.app/imaging/two-photon-microscopy',
  { category: 'Imaging`,
  `Calculate resolution, excitation volume, peak intensity, and depth penetration for two-photon fluorescence microscopy.'
};


const jsonLd = generateCalculatorJsonLd(
  'Two-Photon Microscopy Calculator',
  'Calculate resolution, excitation volume, peak intensity, and depth penetration for two-photon fluorescence microscopy.',
  'https://photonics-calculators.vercel.app/imaging/two-photon-microscopy',
  { category: 'Imaging`,
  `https://photonics-calculators.vercel.app/imaging/two-photon-microscopy`,
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
