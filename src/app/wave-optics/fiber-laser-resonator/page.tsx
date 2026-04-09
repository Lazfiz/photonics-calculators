import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/wave-optics/fiber-laser-resonator' },
    title: 'Fiber Laser Resonator',
  description: 'Interactive Fiber Laser Resonator calculator for photonics and optical engineering.'
};
const jsonLd = generateCalculatorJsonLd(
  `Fiber Laser Resonator',
  description: 'Interactive Fiber Laser Resonator calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Fiber Laser Resonator',
  'Interactive Fiber Laser Resonator calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/wave-optics/fiber-laser-resonator',
  { category: 'Wave Optics`,
  `Interactive Fiber Laser Resonator calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Fiber Laser Resonator',
  'Interactive Fiber Laser Resonator calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/wave-optics/fiber-laser-resonator',
  { category: 'Wave Optics`,
  `https://photonics-calculators.vercel.app/wave-optics/fiber-laser-resonator`,
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
