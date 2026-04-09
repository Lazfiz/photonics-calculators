import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/imaging/two-photon-excitation' },
    title: 'Two-Photon Excitation Calculator',
  description: 'Calculate two-photon excitation wavelength, peak power, and pulse energy from laser parameters.'
};
const jsonLd = generateCalculatorJsonLd(
  `Two-Photon Excitation Calculator',
  description: 'Calculate two-photon excitation wavelength, peak power, and pulse energy from laser parameters.'
};


const jsonLd = generateCalculatorJsonLd(
  'Two-Photon Excitation Calculator',
  'Calculate two-photon excitation wavelength, peak power, and pulse energy from laser parameters.',
  'https://photonics-calculators.vercel.app/imaging/two-photon-excitation',
  { category: 'Imaging`,
  `Calculate two-photon excitation wavelength, peak power, and pulse energy from laser parameters.'
};


const jsonLd = generateCalculatorJsonLd(
  'Two-Photon Excitation Calculator',
  'Calculate two-photon excitation wavelength, peak power, and pulse energy from laser parameters.',
  'https://photonics-calculators.vercel.app/imaging/two-photon-excitation',
  { category: 'Imaging`,
  `https://photonics-calculators.vercel.app/imaging/two-photon-excitation`,
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
