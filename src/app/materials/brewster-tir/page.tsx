import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/materials/brewster-tir' },
    title: 'Brewster Angle & Total Internal Reflection',
  description: 'Interactive Brewster-angle and critical-angle explorer with common material presets.'
};
const jsonLd = generateCalculatorJsonLd(
  `Brewster Angle & Total Internal Reflection',
  description: 'Interactive Brewster-angle and critical-angle explorer with common material presets.'
};


const jsonLd = generateCalculatorJsonLd(
  'Brewster Angle & Total Internal Reflection',
  'Interactive Brewster-angle and critical-angle explorer with common material presets.',
  'https://photonics-calculators.vercel.app/materials/brewster-tir',
  { category: 'Materials`,
  `Interactive Brewster-angle and critical-angle explorer with common material presets.'
};


const jsonLd = generateCalculatorJsonLd(
  'Brewster Angle & Total Internal Reflection',
  'Interactive Brewster-angle and critical-angle explorer with common material presets.',
  'https://photonics-calculators.vercel.app/materials/brewster-tir',
  { category: 'Materials`,
  `https://photonics-calculators.vercel.app/materials/brewster-tir`,
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
