import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/spectroscopy/absorption-depth' },
    title: 'Absorption Depth Calculator',
  description: 'Calculate absorption depth = 1/ and explore spectral dependence for common optical materials.'
};
const jsonLd = generateCalculatorJsonLd(
  `Absorption Depth Calculator',
  description: 'Calculate absorption depth = 1/ and explore spectral dependence for common optical materials.'
};


const jsonLd = generateCalculatorJsonLd(
  'Absorption Depth Calculator',
  'Calculate absorption depth = 1/ and explore spectral dependence for common optical materials.',
  'https://photonics-calculators.vercel.app/spectroscopy/absorption-depth',
  { category: 'Spectroscopy`,
  `Calculate absorption depth = 1/ and explore spectral dependence for common optical materials.'
};


const jsonLd = generateCalculatorJsonLd(
  'Absorption Depth Calculator',
  'Calculate absorption depth = 1/ and explore spectral dependence for common optical materials.',
  'https://photonics-calculators.vercel.app/spectroscopy/absorption-depth',
  { category: 'Spectroscopy`,
  `https://photonics-calculators.vercel.app/spectroscopy/absorption-depth`,
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
