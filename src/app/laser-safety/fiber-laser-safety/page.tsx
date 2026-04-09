import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/laser-safety/fiber-laser-safety' },
    title: 'Fiber Laser Safety Calculator',
  description: 'Analyze output power, fiber facet irradiance, and NOHD for fiber laser systems (1064/1550 nm typical).',
};
const jsonLd = generateCalculatorJsonLd(
  `Fiber Laser Safety Calculator',
  description: 'Analyze output power, fiber facet irradiance, and NOHD for fiber laser systems (1064/1550 nm typical).',
};


const jsonLd = generateCalculatorJsonLd(
  'Fiber Laser Safety Calculator',
  'Analyze output power, fiber facet irradiance, and NOHD for fiber laser systems (1064/1550 nm typical).',
  'https://photonics-calculators.vercel.app/laser-safety/fiber-laser-safety',
  { category: 'Laser Safety`,
  `Analyze output power, fiber facet irradiance, and NOHD for fiber laser systems (1064/1550 nm typical).',
};


const jsonLd = generateCalculatorJsonLd(
  'Fiber Laser Safety Calculator',
  'Analyze output power, fiber facet irradiance, and NOHD for fiber laser systems (1064/1550 nm typical).',
  'https://photonics-calculators.vercel.app/laser-safety/fiber-laser-safety',
  { category: 'Laser Safety`,
  `https://photonics-calculators.vercel.app/laser-safety/fiber-laser-safety`,
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
