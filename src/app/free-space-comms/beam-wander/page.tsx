import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/free-space-comms/beam-wander' },
    title: 'Beam Wander',
  description: 'Interactive Beam Wander calculator for photonics and optical engineering.'
};
const jsonLd = generateCalculatorJsonLd(
  `Beam Wander',
  description: 'Interactive Beam Wander calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Beam Wander',
  'Interactive Beam Wander calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/free-space-comms/beam-wander',
  { category: 'Free Space Comms`,
  `Interactive Beam Wander calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Beam Wander',
  'Interactive Beam Wander calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/free-space-comms/beam-wander',
  { category: 'Free Space Comms`,
  `https://photonics-calculators.vercel.app/free-space-comms/beam-wander`,
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
