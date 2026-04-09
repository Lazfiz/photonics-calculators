import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/spectroscopy/spectral-deconvolution' },
    title: 'Spectral Deconvolution',
  description: 'Decompose overlapping spectral bands into individual Gaussian components.'
};
const jsonLd = generateCalculatorJsonLd(
  `Spectral Deconvolution',
  description: 'Decompose overlapping spectral bands into individual Gaussian components.'
};


const jsonLd = generateCalculatorJsonLd(
  'Spectral Deconvolution',
  'Decompose overlapping spectral bands into individual Gaussian components.',
  'https://photonics-calculators.vercel.app/spectroscopy/spectral-deconvolution',
  { category: 'Spectroscopy`,
  `Decompose overlapping spectral bands into individual Gaussian components.'
};


const jsonLd = generateCalculatorJsonLd(
  'Spectral Deconvolution',
  'Decompose overlapping spectral bands into individual Gaussian components.',
  'https://photonics-calculators.vercel.app/spectroscopy/spectral-deconvolution',
  { category: 'Spectroscopy`,
  `https://photonics-calculators.vercel.app/spectroscopy/spectral-deconvolution`,
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
