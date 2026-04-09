import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/free-space-comms/security' },
    title: 'Security',
  description: 'Interactive Security calculator for photonics and optical engineering.'
};
const jsonLd = generateCalculatorJsonLd(
  `Security',
  description: 'Interactive Security calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Security',
  'Interactive Security calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/free-space-comms/security',
  { category: 'Free Space Comms`,
  `Interactive Security calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Security',
  'Interactive Security calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/free-space-comms/security',
  { category: 'Free Space Comms`,
  `https://photonics-calculators.vercel.app/free-space-comms/security`,
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
