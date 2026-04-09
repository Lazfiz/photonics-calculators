import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/free-space-comms/atmospheric-loss' },
    title: 'Atmospheric Loss',
  description: 'Interactive Atmospheric Loss calculator for photonics and optical engineering.'
};
const jsonLd = generateCalculatorJsonLd(
  `Atmospheric Loss',
  description: 'Interactive Atmospheric Loss calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Atmospheric Loss',
  'Interactive Atmospheric Loss calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/free-space-comms/atmospheric-loss',
  { category: 'Free Space Comms`,
  `Interactive Atmospheric Loss calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Atmospheric Loss',
  'Interactive Atmospheric Loss calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/free-space-comms/atmospheric-loss',
  { category: 'Free Space Comms`,
  `https://photonics-calculators.vercel.app/free-space-comms/atmospheric-loss`,
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
