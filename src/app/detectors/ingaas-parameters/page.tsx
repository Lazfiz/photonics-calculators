import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/detectors/ingaas-parameters' },
    title: 'InGaAs Detector Parameters',
  description: 'InₓGa₋ₓAs bandgap, cutoff wavelength, QE, dark current, NEP for SWIR detectors.'
};
const jsonLd = generateCalculatorJsonLd(
  `InGaAs Detector Parameters',
  description: 'InₓGa₋ₓAs bandgap, cutoff wavelength, QE, dark current, NEP for SWIR detectors.'
};


const jsonLd = generateCalculatorJsonLd(
  'InGaAs Detector Parameters',
  'InₓGa₋ₓAs bandgap, cutoff wavelength, QE, dark current, NEP for SWIR detectors.',
  'https://photonics-calculators.vercel.app/detectors/ingaas-parameters',
  { category: 'Detectors`,
  `InₓGa₋ₓAs bandgap, cutoff wavelength, QE, dark current, NEP for SWIR detectors.'
};


const jsonLd = generateCalculatorJsonLd(
  'InGaAs Detector Parameters',
  'InₓGa₋ₓAs bandgap, cutoff wavelength, QE, dark current, NEP for SWIR detectors.',
  'https://photonics-calculators.vercel.app/detectors/ingaas-parameters',
  { category: 'Detectors`,
  `https://photonics-calculators.vercel.app/detectors/ingaas-parameters`,
  { category: `Detectors` }
);
export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}
