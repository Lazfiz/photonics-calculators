import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/free-space-comms/quantum-key-distribution' },
    title: 'Quantum Key Distribution',
  description: 'Interactive Quantum Key Distribution calculator for photonics and optical engineering.'
};
const jsonLd = generateCalculatorJsonLd(
  `Quantum Key Distribution',
  description: 'Interactive Quantum Key Distribution calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Quantum Key Distribution',
  'Interactive Quantum Key Distribution calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/free-space-comms/quantum-key-distribution',
  { category: 'Free Space Comms`,
  `Interactive Quantum Key Distribution calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Quantum Key Distribution',
  'Interactive Quantum Key Distribution calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/free-space-comms/quantum-key-distribution',
  { category: 'Free Space Comms`,
  `https://photonics-calculators.vercel.app/free-space-comms/quantum-key-distribution`,
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
