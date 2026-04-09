import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/free-space-comms/lasercom-link' },
    title: 'Lasercom Link',
  description: 'Interactive Lasercom Link calculator for photonics and optical engineering.'
};
const jsonLd = generateCalculatorJsonLd(
  `Lasercom Link',
  description: 'Interactive Lasercom Link calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Lasercom Link',
  'Interactive Lasercom Link calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/free-space-comms/lasercom-link',
  { category: 'Free Space Comms`,
  `Interactive Lasercom Link calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Lasercom Link',
  'Interactive Lasercom Link calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/free-space-comms/lasercom-link',
  { category: 'Free Space Comms`,
  `https://photonics-calculators.vercel.app/free-space-comms/lasercom-link`,
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
