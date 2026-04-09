import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/spectroscopy/emission-spectra' },
    title: 'Emission Spectra Fitting',
  description: 'Model photoluminescence emission with asymmetric Gaussian line shapes.'
};
const jsonLd = generateCalculatorJsonLd(
  `Emission Spectra Fitting',
  description: 'Model photoluminescence emission with asymmetric Gaussian line shapes.'
};


const jsonLd = generateCalculatorJsonLd(
  'Emission Spectra Fitting',
  'Model photoluminescence emission with asymmetric Gaussian line shapes.',
  'https://photonics-calculators.vercel.app/spectroscopy/emission-spectra',
  { category: 'Spectroscopy`,
  `Model photoluminescence emission with asymmetric Gaussian line shapes.'
};


const jsonLd = generateCalculatorJsonLd(
  'Emission Spectra Fitting',
  'Model photoluminescence emission with asymmetric Gaussian line shapes.',
  'https://photonics-calculators.vercel.app/spectroscopy/emission-spectra',
  { category: 'Spectroscopy`,
  `https://photonics-calculators.vercel.app/spectroscopy/emission-spectra`,
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
