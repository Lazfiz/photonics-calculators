import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/free-space-comms/acquisition-tracking' },
    title: 'Acquisition Tracking',
  description: 'Interactive Acquisition Tracking calculator for photonics and optical engineering.'
};
const jsonLd = generateCalculatorJsonLd(
  `Acquisition Tracking',
  description: 'Interactive Acquisition Tracking calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Acquisition Tracking',
  'Interactive Acquisition Tracking calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/free-space-comms/acquisition-tracking',
  { category: 'Free Space Comms`,
  `Interactive Acquisition Tracking calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Acquisition Tracking',
  'Interactive Acquisition Tracking calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/free-space-comms/acquisition-tracking',
  { category: 'Free Space Comms`,
  `https://photonics-calculators.vercel.app/free-space-comms/acquisition-tracking`,
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
