import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/laser-safety/scanned-mpe' },
    title: 'Scanned Beam MPE',
  description: 'Interactive Scanned Beam MPE calculator for photonics and optical engineering.'
};
const jsonLd = generateCalculatorJsonLd(
  `Scanned Beam MPE',
  description: 'Interactive Scanned Beam MPE calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Scanned Beam MPE',
  'Interactive Scanned Beam MPE calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/laser-safety/scanned-mpe',
  { category: 'Laser Safety`,
  `Interactive Scanned Beam MPE calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Scanned Beam MPE',
  'Interactive Scanned Beam MPE calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/laser-safety/scanned-mpe',
  { category: 'Laser Safety`,
  `https://photonics-calculators.vercel.app/laser-safety/scanned-mpe`,
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
