import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/imaging/mtf' },
    title: 'Modulation Transfer Function',
  description: 'Diffraction-limited incoherent MTF with defocus effects.'
};
const jsonLd = generateCalculatorJsonLd(
  `Modulation Transfer Function',
  description: 'Diffraction-limited incoherent MTF with defocus effects.'
};


const jsonLd = generateCalculatorJsonLd(
  'Modulation Transfer Function',
  'Diffraction-limited incoherent MTF with defocus effects.',
  'https://photonics-calculators.vercel.app/imaging/mtf',
  { category: 'Imaging`,
  `Diffraction-limited incoherent MTF with defocus effects.'
};


const jsonLd = generateCalculatorJsonLd(
  'Modulation Transfer Function',
  'Diffraction-limited incoherent MTF with defocus effects.',
  'https://photonics-calculators.vercel.app/imaging/mtf',
  { category: 'Imaging`,
  `https://photonics-calculators.vercel.app/imaging/mtf`,
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
