import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/wave-optics/slab-laser' },
    title: 'Slab Laser',
  description: 'Interactive Slab Laser calculator for photonics and optical engineering.'
};
const jsonLd = generateCalculatorJsonLd(
  `Slab Laser',
  description: 'Interactive Slab Laser calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Slab Laser',
  'Interactive Slab Laser calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/wave-optics/slab-laser',
  { category: 'Wave Optics`,
  `Interactive Slab Laser calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Slab Laser',
  'Interactive Slab Laser calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/wave-optics/slab-laser',
  { category: 'Wave Optics`,
  `https://photonics-calculators.vercel.app/wave-optics/slab-laser`,
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
