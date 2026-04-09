import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/laser-safety/blue-light-hazard' },
    title: 'Blue Light Hazard',
  description: 'Interactive Blue Light Hazard calculator for photonics and optical engineering.'
};
const jsonLd = generateCalculatorJsonLd(
  `Blue Light Hazard',
  description: 'Interactive Blue Light Hazard calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Blue Light Hazard',
  'Interactive Blue Light Hazard calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/laser-safety/blue-light-hazard',
  { category: 'Laser Safety`,
  `Interactive Blue Light Hazard calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Blue Light Hazard',
  'Interactive Blue Light Hazard calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/laser-safety/blue-light-hazard',
  { category: 'Laser Safety`,
  `https://photonics-calculators.vercel.app/laser-safety/blue-light-hazard`,
  { category: `Laser Safety` }
);
export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}
