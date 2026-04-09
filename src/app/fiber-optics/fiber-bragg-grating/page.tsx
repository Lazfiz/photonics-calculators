import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/fiber-optics/fiber-bragg-grating' },
    title: 'Fiber Bragg Grating',
  description: 'Interactive Fiber Bragg Grating calculator for photonics and optical engineering.'
};
const jsonLd = generateCalculatorJsonLd(
  `Fiber Bragg Grating',
  description: 'Interactive Fiber Bragg Grating calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Fiber Bragg Grating',
  'Interactive Fiber Bragg Grating calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/fiber-optics/fiber-bragg-grating',
  { category: 'Fiber Optics`,
  `Interactive Fiber Bragg Grating calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Fiber Bragg Grating',
  'Interactive Fiber Bragg Grating calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/fiber-optics/fiber-bragg-grating',
  { category: 'Fiber Optics`,
  `https://photonics-calculators.vercel.app/fiber-optics/fiber-bragg-grating`,
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
