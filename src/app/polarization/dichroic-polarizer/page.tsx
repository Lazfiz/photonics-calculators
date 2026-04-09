import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/polarization/dichroic-polarizer' },
    title: 'Dichroic Polarizer',
  description: 'Model absorption-based dichroic polarizers using complex refractive indices. One polarization state is strongly absorbed while the other transmits.'
};
const jsonLd = generateCalculatorJsonLd(
  `Dichroic Polarizer',
  description: 'Model absorption-based dichroic polarizers using complex refractive indices. One polarization state is strongly absorbed while the other transmits.'
};


const jsonLd = generateCalculatorJsonLd(
  'Dichroic Polarizer',
  'Model absorption-based dichroic polarizers using complex refractive indices. One polarization state is strongly absorbed while the other transmits.',
  'https://photonics-calculators.vercel.app/polarization/dichroic-polarizer',
  { category: 'Polarization`,
  `Model absorption-based dichroic polarizers using complex refractive indices. One polarization state is strongly absorbed while the other transmits.'
};


const jsonLd = generateCalculatorJsonLd(
  'Dichroic Polarizer',
  'Model absorption-based dichroic polarizers using complex refractive indices. One polarization state is strongly absorbed while the other transmits.',
  'https://photonics-calculators.vercel.app/polarization/dichroic-polarizer',
  { category: 'Polarization`,
  `https://photonics-calculators.vercel.app/polarization/dichroic-polarizer`,
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
