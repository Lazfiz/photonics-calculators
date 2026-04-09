import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/laser-safety/maximum-exposure' },
    title: 'Maximum Exposure Duration',
  description: 'Interactive Maximum Exposure Duration calculator for photonics and optical engineering.'
};
const jsonLd = generateCalculatorJsonLd(
  `Maximum Exposure Duration',
  description: 'Interactive Maximum Exposure Duration calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Maximum Exposure Duration',
  'Interactive Maximum Exposure Duration calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/laser-safety/maximum-exposure',
  { category: 'Laser Safety`,
  `Interactive Maximum Exposure Duration calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Maximum Exposure Duration',
  'Interactive Maximum Exposure Duration calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/laser-safety/maximum-exposure',
  { category: 'Laser Safety`,
  `https://photonics-calculators.vercel.app/laser-safety/maximum-exposure`,
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
