import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/wave-optics/supercontinuum' },
    title: 'Supercontinuum Generation',
  description: 'Broadband SC generation in photonic crystal fibers via soliton fission, SPM, and dispersive wave generation.'
};
const jsonLd = generateCalculatorJsonLd(
  `Supercontinuum Generation',
  description: 'Broadband SC generation in photonic crystal fibers via soliton fission, SPM, and dispersive wave generation.'
};


const jsonLd = generateCalculatorJsonLd(
  'Supercontinuum Generation',
  'Broadband SC generation in photonic crystal fibers via soliton fission, SPM, and dispersive wave generation.',
  'https://photonics-calculators.vercel.app/wave-optics/supercontinuum',
  { category: 'Wave Optics`,
  `Broadband SC generation in photonic crystal fibers via soliton fission, SPM, and dispersive wave generation.'
};


const jsonLd = generateCalculatorJsonLd(
  'Supercontinuum Generation',
  'Broadband SC generation in photonic crystal fibers via soliton fission, SPM, and dispersive wave generation.',
  'https://photonics-calculators.vercel.app/wave-optics/supercontinuum',
  { category: 'Wave Optics`,
  `https://photonics-calculators.vercel.app/wave-optics/supercontinuum`,
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
