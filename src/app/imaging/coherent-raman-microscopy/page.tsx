import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/imaging/coherent-raman-microscopy' },
    title: 'Coherent Raman Microscopy Calculator',
  description: 'Calculate Stokes wavelengths, spectral resolution, and spatial resolution for CARS and SRS microscopy.'
};
const jsonLd = generateCalculatorJsonLd(
  `Coherent Raman Microscopy Calculator',
  description: 'Calculate Stokes wavelengths, spectral resolution, and spatial resolution for CARS and SRS microscopy.'
};


const jsonLd = generateCalculatorJsonLd(
  'Coherent Raman Microscopy Calculator',
  'Calculate Stokes wavelengths, spectral resolution, and spatial resolution for CARS and SRS microscopy.',
  'https://photonics-calculators.vercel.app/imaging/coherent-raman-microscopy',
  { category: 'Imaging`,
  `Calculate Stokes wavelengths, spectral resolution, and spatial resolution for CARS and SRS microscopy.'
};


const jsonLd = generateCalculatorJsonLd(
  'Coherent Raman Microscopy Calculator',
  'Calculate Stokes wavelengths, spectral resolution, and spatial resolution for CARS and SRS microscopy.',
  'https://photonics-calculators.vercel.app/imaging/coherent-raman-microscopy',
  { category: 'Imaging`,
  `https://photonics-calculators.vercel.app/imaging/coherent-raman-microscopy`,
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
