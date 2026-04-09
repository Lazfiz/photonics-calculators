import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/free-space-comms/adaptive-optics-gain' },
    title: 'Adaptive Optics Gain',
  description: 'Interactive Adaptive Optics Gain calculator for photonics and optical engineering.'
};
const jsonLd = generateCalculatorJsonLd(
  `Adaptive Optics Gain',
  description: 'Interactive Adaptive Optics Gain calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Adaptive Optics Gain',
  'Interactive Adaptive Optics Gain calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/free-space-comms/adaptive-optics-gain',
  { category: 'Free Space Comms`,
  `Interactive Adaptive Optics Gain calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Adaptive Optics Gain',
  'Interactive Adaptive Optics Gain calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/free-space-comms/adaptive-optics-gain',
  { category: 'Free Space Comms`,
  `https://photonics-calculators.vercel.app/free-space-comms/adaptive-optics-gain`,
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
