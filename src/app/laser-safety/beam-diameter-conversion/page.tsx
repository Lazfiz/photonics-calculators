import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/laser-safety/beam-diameter-conversion' },
    title: 'Beam Diameter Conversion',
  description: 'Interactive Beam Diameter Conversion calculator for photonics and optical engineering.'
};
const jsonLd = generateCalculatorJsonLd(
  `Beam Diameter Conversion',
  description: 'Interactive Beam Diameter Conversion calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Beam Diameter Conversion',
  'Interactive Beam Diameter Conversion calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/laser-safety/beam-diameter-conversion',
  { category: 'Laser Safety`,
  `Interactive Beam Diameter Conversion calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Beam Diameter Conversion',
  'Interactive Beam Diameter Conversion calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/laser-safety/beam-diameter-conversion',
  { category: 'Laser Safety`,
  `https://photonics-calculators.vercel.app/laser-safety/beam-diameter-conversion`,
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
