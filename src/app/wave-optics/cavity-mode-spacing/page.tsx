import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/wave-optics/cavity-mode-spacing' },
    title: 'Cavity Mode Spacing',
  description: 'Axial and transverse mode structure of optical resonators.'
};
const jsonLd = generateCalculatorJsonLd(
  `Cavity Mode Spacing',
  description: 'Axial and transverse mode structure of optical resonators.'
};


const jsonLd = generateCalculatorJsonLd(
  'Cavity Mode Spacing',
  'Axial and transverse mode structure of optical resonators.',
  'https://photonics-calculators.vercel.app/wave-optics/cavity-mode-spacing',
  { category: 'Wave Optics`,
  `Axial and transverse mode structure of optical resonators.'
};


const jsonLd = generateCalculatorJsonLd(
  'Cavity Mode Spacing',
  'Axial and transverse mode structure of optical resonators.',
  'https://photonics-calculators.vercel.app/wave-optics/cavity-mode-spacing',
  { category: 'Wave Optics`,
  `https://photonics-calculators.vercel.app/wave-optics/cavity-mode-spacing`,
  { category: `Wave Optics` }
);
export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}
