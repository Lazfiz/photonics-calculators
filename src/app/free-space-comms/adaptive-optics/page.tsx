import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/free-space-comms/adaptive-optics' },
    title: 'Adaptive Optics',
  description: 'Interactive Adaptive Optics calculator for photonics and optical engineering.'
};
const jsonLd = generateCalculatorJsonLd(
  `Adaptive Optics',
  description: 'Interactive Adaptive Optics calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Adaptive Optics',
  'Interactive Adaptive Optics calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/free-space-comms/adaptive-optics',
  { category: 'Free Space Comms`,
  `Interactive Adaptive Optics calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Adaptive Optics',
  'Interactive Adaptive Optics calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/free-space-comms/adaptive-optics',
  { category: 'Free Space Comms`,
  `https://photonics-calculators.vercel.app/free-space-comms/adaptive-optics`,
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
