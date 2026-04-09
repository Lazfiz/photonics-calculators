import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/polarization/polymer-polarizer' },
    title: 'Polymer (Sheet) Polarizer',
  description: 'Model iodine-doped PVA film polarizers (e.g., H-sheet). Absorption-based dichroic polarizers with selectable dichroic ratio and film thickness.'
};
const jsonLd = generateCalculatorJsonLd(
  `Polymer (Sheet) Polarizer',
  description: 'Model iodine-doped PVA film polarizers (e.g., H-sheet). Absorption-based dichroic polarizers with selectable dichroic ratio and film thickness.'
};


const jsonLd = generateCalculatorJsonLd(
  'Polymer (Sheet) Polarizer',
  'Model iodine-doped PVA film polarizers (e.g., H-sheet). Absorption-based dichroic polarizers with selectable dichroic ratio and film thickness.',
  'https://photonics-calculators.vercel.app/polarization/polymer-polarizer',
  { category: 'Polarization`,
  `Model iodine-doped PVA film polarizers (e.g., H-sheet). Absorption-based dichroic polarizers with selectable dichroic ratio and film thickness.'
};


const jsonLd = generateCalculatorJsonLd(
  'Polymer (Sheet) Polarizer',
  'Model iodine-doped PVA film polarizers (e.g., H-sheet). Absorption-based dichroic polarizers with selectable dichroic ratio and film thickness.',
  'https://photonics-calculators.vercel.app/polarization/polymer-polarizer',
  { category: 'Polarization`,
  `https://photonics-calculators.vercel.app/polarization/polymer-polarizer`,
  { category: `Polarization` }
);
export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}
