import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/polarization/waveplate-order' },
    title: 'Waveplate Order',
  description: 'Calculate waveplate order, retardation, and wavelength-dependent performance.'
};
const jsonLd = generateCalculatorJsonLd(
  `Waveplate Order',
  description: 'Calculate waveplate order, retardation, and wavelength-dependent performance.'
};


const jsonLd = generateCalculatorJsonLd(
  'Waveplate Order',
  'Calculate waveplate order, retardation, and wavelength-dependent performance.',
  'https://photonics-calculators.vercel.app/polarization/waveplate-order',
  { category: 'Polarization`,
  `Calculate waveplate order, retardation, and wavelength-dependent performance.'
};


const jsonLd = generateCalculatorJsonLd(
  'Waveplate Order',
  'Calculate waveplate order, retardation, and wavelength-dependent performance.',
  'https://photonics-calculators.vercel.app/polarization/waveplate-order',
  { category: 'Polarization`,
  `https://photonics-calculators.vercel.app/polarization/waveplate-order`,
  { category: `Polarization` }
);
export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}
