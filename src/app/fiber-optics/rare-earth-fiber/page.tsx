import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/fiber-optics/rare-earth-fiber' },
    title: 'Rare Earth Fiber',
  description: 'Interactive Rare Earth Fiber calculator for photonics and optical engineering.'
};
const jsonLd = generateCalculatorJsonLd(
  `Rare Earth Fiber',
  description: 'Interactive Rare Earth Fiber calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Rare Earth Fiber',
  'Interactive Rare Earth Fiber calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/fiber-optics/rare-earth-fiber',
  { category: 'Fiber Optics`,
  `Interactive Rare Earth Fiber calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Rare Earth Fiber',
  'Interactive Rare Earth Fiber calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/fiber-optics/rare-earth-fiber',
  { category: 'Fiber Optics`,
  `https://photonics-calculators.vercel.app/fiber-optics/rare-earth-fiber`,
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
