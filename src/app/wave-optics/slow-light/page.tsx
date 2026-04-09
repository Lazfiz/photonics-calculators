import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/wave-optics/slow-light' },
    title: 'Slow Light Structures',
  description: 'Group velocity reduction in photonic crystals and EIT media.'
};
const jsonLd = generateCalculatorJsonLd(
  `Slow Light Structures',
  description: 'Group velocity reduction in photonic crystals and EIT media.'
};


const jsonLd = generateCalculatorJsonLd(
  'Slow Light Structures',
  'Group velocity reduction in photonic crystals and EIT media.',
  'https://photonics-calculators.vercel.app/wave-optics/slow-light',
  { category: 'Wave Optics`,
  `Group velocity reduction in photonic crystals and EIT media.'
};


const jsonLd = generateCalculatorJsonLd(
  'Slow Light Structures',
  'Group velocity reduction in photonic crystals and EIT media.',
  'https://photonics-calculators.vercel.app/wave-optics/slow-light',
  { category: 'Wave Optics`,
  `https://photonics-calculators.vercel.app/wave-optics/slow-light`,
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
