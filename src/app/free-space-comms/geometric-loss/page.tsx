import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/free-space-comms/geometric-loss' },
    title: 'Geometric Loss',
  description: 'Interactive Geometric Loss calculator for photonics and optical engineering.'
};
const jsonLd = generateCalculatorJsonLd(
  `Geometric Loss',
  description: 'Interactive Geometric Loss calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Geometric Loss',
  'Interactive Geometric Loss calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/free-space-comms/geometric-loss',
  { category: 'Free Space Comms`,
  `Interactive Geometric Loss calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Geometric Loss',
  'Interactive Geometric Loss calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/free-space-comms/geometric-loss',
  { category: 'Free Space Comms`,
  `https://photonics-calculators.vercel.app/free-space-comms/geometric-loss`,
  { category: `Free Space Comms` }
);
export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}
