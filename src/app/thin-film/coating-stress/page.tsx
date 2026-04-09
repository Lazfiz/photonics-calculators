import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/thin-film/coating-stress' },
      title: 'Coating Stress amp; Curvature',
  description: 'Stoney equation: κ = 6fdf / (Ests²).',
};
const jsonLd = generateCalculatorJsonLd(
  `Coating Stress amp; Curvature',
  description: 'Stoney equation: κ = 6fdf / (Ests²).',
};


const jsonLd = generateCalculatorJsonLd(
  'Coating Stress amp; Curvature',
  'Stoney equation: κ = 6fdf / (Ests²).',
  'https://photonics-calculators.vercel.app/thin-film/coating-stress',
  { category: 'Thin Film`,
  `Stoney equation: κ = 6fdf / (Ests²).',
};


const jsonLd = generateCalculatorJsonLd(
  'Coating Stress amp; Curvature',
  'Stoney equation: κ = 6fdf / (Ests²).',
  'https://photonics-calculators.vercel.app/thin-film/coating-stress',
  { category: 'Thin Film`,
  `https://photonics-calculators.vercel.app/thin-film/coating-stress`,
  { category: `Thin Film` }
);
export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}
