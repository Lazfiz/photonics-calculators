import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/wave-optics/dye-laser-resonator' },
    title: 'Dye Laser Resonator',
  description: 'Interactive Dye Laser Resonator calculator for photonics and optical engineering.'
};
const jsonLd = generateCalculatorJsonLd(
  `Dye Laser Resonator',
  description: 'Interactive Dye Laser Resonator calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Dye Laser Resonator',
  'Interactive Dye Laser Resonator calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/wave-optics/dye-laser-resonator',
  { category: 'Wave Optics`,
  `Interactive Dye Laser Resonator calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Dye Laser Resonator',
  'Interactive Dye Laser Resonator calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/wave-optics/dye-laser-resonator',
  { category: 'Wave Optics`,
  `https://photonics-calculators.vercel.app/wave-optics/dye-laser-resonator`,
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
