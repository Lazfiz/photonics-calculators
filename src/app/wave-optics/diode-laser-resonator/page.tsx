import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/wave-optics/diode-laser-resonator' },
    title: 'Diode Laser Resonator',
  description: 'Interactive Diode Laser Resonator calculator for photonics and optical engineering.'
};
const jsonLd = generateCalculatorJsonLd(
  `Diode Laser Resonator',
  description: 'Interactive Diode Laser Resonator calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Diode Laser Resonator',
  'Interactive Diode Laser Resonator calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/wave-optics/diode-laser-resonator',
  { category: 'Wave Optics`,
  `Interactive Diode Laser Resonator calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Diode Laser Resonator',
  'Interactive Diode Laser Resonator calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/wave-optics/diode-laser-resonator',
  { category: 'Wave Optics`,
  `https://photonics-calculators.vercel.app/wave-optics/diode-laser-resonator`,
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
