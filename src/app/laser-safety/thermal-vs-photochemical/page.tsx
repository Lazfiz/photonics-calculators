import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/laser-safety/thermal-vs-photochemical' },
    title: 'Thermal vs Photochemical MPE',
  description: 'Interactive Thermal vs Photochemical MPE calculator for photonics and optical engineering.'
};
const jsonLd = generateCalculatorJsonLd(
  `Thermal vs Photochemical MPE',
  description: 'Interactive Thermal vs Photochemical MPE calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Thermal vs Photochemical MPE',
  'Interactive Thermal vs Photochemical MPE calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/laser-safety/thermal-vs-photochemical',
  { category: 'Laser Safety`,
  `Interactive Thermal vs Photochemical MPE calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Thermal vs Photochemical MPE',
  'Interactive Thermal vs Photochemical MPE calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/laser-safety/thermal-vs-photochemical',
  { category: 'Laser Safety`,
  `https://photonics-calculators.vercel.app/laser-safety/thermal-vs-photochemical`,
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
