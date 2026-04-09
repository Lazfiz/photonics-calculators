import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/free-space-comms/point-ahead' },
    title: 'Point Ahead',
  description: 'Interactive Point Ahead calculator for photonics and optical engineering.'
};
const jsonLd = generateCalculatorJsonLd(
  `Point Ahead',
  description: 'Interactive Point Ahead calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Point Ahead',
  'Interactive Point Ahead calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/free-space-comms/point-ahead',
  { category: 'Free Space Comms`,
  `Interactive Point Ahead calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Point Ahead',
  'Interactive Point Ahead calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/free-space-comms/point-ahead',
  { category: 'Free Space Comms`,
  `https://photonics-calculators.vercel.app/free-space-comms/point-ahead`,
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
