import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/fiber-optics/dispersion-shifted' },
    title: 'Dispersion Shifted',
  description: 'Interactive Dispersion Shifted calculator for photonics and optical engineering.'
};
const jsonLd = generateCalculatorJsonLd(
  `Dispersion Shifted',
  description: 'Interactive Dispersion Shifted calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Dispersion Shifted',
  'Interactive Dispersion Shifted calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/fiber-optics/dispersion-shifted',
  { category: 'Fiber Optics`,
  `Interactive Dispersion Shifted calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Dispersion Shifted',
  'Interactive Dispersion Shifted calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/fiber-optics/dispersion-shifted',
  { category: 'Fiber Optics`,
  `https://photonics-calculators.vercel.app/fiber-optics/dispersion-shifted`,
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
