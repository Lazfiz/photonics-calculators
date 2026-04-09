import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/imaging/fcs' },
    title: 'FCS Calculator',
  description: 'Fluorescence Correlation Spectroscopy — diffusion time, concentration, and confocal volume.'
};
const jsonLd = generateCalculatorJsonLd(
  `FCS Calculator',
  description: 'Fluorescence Correlation Spectroscopy — diffusion time, concentration, and confocal volume.'
};


const jsonLd = generateCalculatorJsonLd(
  'FCS Calculator',
  'Fluorescence Correlation Spectroscopy — diffusion time, concentration, and confocal volume.',
  'https://photonics-calculators.vercel.app/imaging/fcs',
  { category: 'Imaging`,
  `Fluorescence Correlation Spectroscopy — diffusion time, concentration, and confocal volume.'
};


const jsonLd = generateCalculatorJsonLd(
  'FCS Calculator',
  'Fluorescence Correlation Spectroscopy — diffusion time, concentration, and confocal volume.',
  'https://photonics-calculators.vercel.app/imaging/fcs',
  { category: 'Imaging`,
  `https://photonics-calculators.vercel.app/imaging/fcs`,
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
