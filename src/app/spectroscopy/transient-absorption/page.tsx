import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/spectroscopy/transient-absorption' },
    title: 'Transient Absorption Spectroscopy',
  description: 'A spectra vs delay time. Decompose into GSB, ESA, and SE contributions across the probe range.'
};
const jsonLd = generateCalculatorJsonLd(
  `Transient Absorption Spectroscopy',
  description: 'A spectra vs delay time. Decompose into GSB, ESA, and SE contributions across the probe range.'
};


const jsonLd = generateCalculatorJsonLd(
  'Transient Absorption Spectroscopy',
  'A spectra vs delay time. Decompose into GSB, ESA, and SE contributions across the probe range.',
  'https://photonics-calculators.vercel.app/spectroscopy/transient-absorption',
  { category: 'Spectroscopy`,
  `A spectra vs delay time. Decompose into GSB, ESA, and SE contributions across the probe range.'
};


const jsonLd = generateCalculatorJsonLd(
  'Transient Absorption Spectroscopy',
  'A spectra vs delay time. Decompose into GSB, ESA, and SE contributions across the probe range.',
  'https://photonics-calculators.vercel.app/spectroscopy/transient-absorption',
  { category: 'Spectroscopy`,
  `https://photonics-calculators.vercel.app/spectroscopy/transient-absorption`,
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
