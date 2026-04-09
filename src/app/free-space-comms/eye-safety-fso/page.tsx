import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/free-space-comms/eye-safety-fso' },
    title: 'Eye Safety Fso',
  description: 'Interactive Eye Safety Fso calculator for photonics and optical engineering.'
};
const jsonLd = generateCalculatorJsonLd(
  `Eye Safety Fso',
  description: 'Interactive Eye Safety Fso calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Eye Safety Fso',
  'Interactive Eye Safety Fso calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/free-space-comms/eye-safety-fso',
  { category: 'Free Space Comms`,
  `Interactive Eye Safety Fso calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Eye Safety Fso',
  'Interactive Eye Safety Fso calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/free-space-comms/eye-safety-fso',
  { category: 'Free Space Comms`,
  `https://photonics-calculators.vercel.app/free-space-comms/eye-safety-fso`,
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
