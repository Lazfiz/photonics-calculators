import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/fiber-optics/polarization-controller' },
    title: 'Polarization Controller',
  description: 'Interactive Polarization Controller calculator for photonics and optical engineering.'
};
const jsonLd = generateCalculatorJsonLd(
  `Polarization Controller',
  description: 'Interactive Polarization Controller calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Polarization Controller',
  'Interactive Polarization Controller calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/fiber-optics/polarization-controller',
  { category: 'Fiber Optics`,
  `Interactive Polarization Controller calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Polarization Controller',
  'Interactive Polarization Controller calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/fiber-optics/polarization-controller',
  { category: 'Fiber Optics`,
  `https://photonics-calculators.vercel.app/fiber-optics/polarization-controller`,
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
