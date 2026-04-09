import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/wave-optics/solid-state-laser-resonator' },
    title: 'Solid State Laser Resonator',
  description: 'Interactive Solid State Laser Resonator calculator for photonics and optical engineering.'
};
const jsonLd = generateCalculatorJsonLd(
  `Solid State Laser Resonator',
  description: 'Interactive Solid State Laser Resonator calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Solid State Laser Resonator',
  'Interactive Solid State Laser Resonator calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/wave-optics/solid-state-laser-resonator',
  { category: 'Wave Optics`,
  `Interactive Solid State Laser Resonator calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Solid State Laser Resonator',
  'Interactive Solid State Laser Resonator calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/wave-optics/solid-state-laser-resonator',
  { category: 'Wave Optics`,
  `https://photonics-calculators.vercel.app/wave-optics/solid-state-laser-resonator`,
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
