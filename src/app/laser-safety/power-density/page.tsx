import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/laser-safety/power-density' },
    title: 'Power Density Calculator',
  description: 'Interactive Power Density Calculator calculator for photonics and optical engineering.'
};
const jsonLd = generateCalculatorJsonLd(
  `Power Density Calculator',
  description: 'Interactive Power Density Calculator calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Power Density Calculator',
  'Interactive Power Density Calculator calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/laser-safety/power-density',
  { category: 'Laser Safety`,
  `Interactive Power Density Calculator calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Power Density Calculator',
  'Interactive Power Density Calculator calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/laser-safety/power-density',
  { category: 'Laser Safety`,
  `https://photonics-calculators.vercel.app/laser-safety/power-density`,
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
