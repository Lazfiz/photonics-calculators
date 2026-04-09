import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/fiber-optics/rare-earth-doped' },
    title: 'Rare Earth Doped',
  description: 'Interactive Rare Earth Doped calculator for photonics and optical engineering.'
};
const jsonLd = generateCalculatorJsonLd(
  `Rare Earth Doped',
  description: 'Interactive Rare Earth Doped calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Rare Earth Doped',
  'Interactive Rare Earth Doped calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/fiber-optics/rare-earth-doped',
  { category: 'Fiber Optics`,
  `Interactive Rare Earth Doped calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Rare Earth Doped',
  'Interactive Rare Earth Doped calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/fiber-optics/rare-earth-doped',
  { category: 'Fiber Optics`,
  `https://photonics-calculators.vercel.app/fiber-optics/rare-earth-doped`,
  { category: `Fiber Optics` }
);
export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}
