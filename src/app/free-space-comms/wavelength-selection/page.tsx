import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/free-space-comms/wavelength-selection' },
    title: 'Wavelength Selection',
  description: 'Interactive Wavelength Selection calculator for photonics and optical engineering.'
};
const jsonLd = generateCalculatorJsonLd(
  `Wavelength Selection',
  description: 'Interactive Wavelength Selection calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Wavelength Selection',
  'Interactive Wavelength Selection calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/free-space-comms/wavelength-selection',
  { category: 'Free Space Comms`,
  `Interactive Wavelength Selection calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Wavelength Selection',
  'Interactive Wavelength Selection calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/free-space-comms/wavelength-selection',
  { category: 'Free Space Comms`,
  `https://photonics-calculators.vercel.app/free-space-comms/wavelength-selection`,
  { category: `Free Space Comms` }
);
export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}
