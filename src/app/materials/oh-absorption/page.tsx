import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/materials/oh-absorption' },
    title: 'OH Absorption in Silica',
  description: 'Hydroxyl (OH⁻) absorption peaks in silica fibers and bulk glass. The fundamental OH stretch at 2.72 µm and overtones at 1.38 µm and 0.94 µm dominate loss spectra.'
};
const jsonLd = generateCalculatorJsonLd(
  `OH Absorption in Silica',
  description: 'Hydroxyl (OH⁻) absorption peaks in silica fibers and bulk glass. The fundamental OH stretch at 2.72 µm and overtones at 1.38 µm and 0.94 µm dominate loss spectra.'
};


const jsonLd = generateCalculatorJsonLd(
  'OH Absorption in Silica',
  'Hydroxyl (OH⁻) absorption peaks in silica fibers and bulk glass. The fundamental OH stretch at 2.72 µm and overtones at 1.38 µm and 0.94 µm dominate loss spectra.',
  'https://photonics-calculators.vercel.app/materials/oh-absorption',
  { category: 'Materials`,
  `Hydroxyl (OH⁻) absorption peaks in silica fibers and bulk glass. The fundamental OH stretch at 2.72 µm and overtones at 1.38 µm and 0.94 µm dominate loss spectra.'
};


const jsonLd = generateCalculatorJsonLd(
  'OH Absorption in Silica',
  'Hydroxyl (OH⁻) absorption peaks in silica fibers and bulk glass. The fundamental OH stretch at 2.72 µm and overtones at 1.38 µm and 0.94 µm dominate loss spectra.',
  'https://photonics-calculators.vercel.app/materials/oh-absorption',
  { category: 'Materials`,
  `https://photonics-calculators.vercel.app/materials/oh-absorption`,
  { category: `Materials` }
);
export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}
