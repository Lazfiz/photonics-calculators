import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/wave-optics/gas-laser-resonator' },
    title: 'Gas Laser Resonator',
  description: 'Interactive Gas Laser Resonator calculator for photonics and optical engineering.'
};
const jsonLd = generateCalculatorJsonLd(
  `Gas Laser Resonator',
  description: 'Interactive Gas Laser Resonator calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Gas Laser Resonator',
  'Interactive Gas Laser Resonator calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/wave-optics/gas-laser-resonator',
  { category: 'Wave Optics`,
  `Interactive Gas Laser Resonator calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Gas Laser Resonator',
  'Interactive Gas Laser Resonator calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/wave-optics/gas-laser-resonator',
  { category: 'Wave Optics`,
  `https://photonics-calculators.vercel.app/wave-optics/gas-laser-resonator`,
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
