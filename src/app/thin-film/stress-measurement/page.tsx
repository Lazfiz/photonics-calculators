import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/thin-film/stress-measurement' },
    title: 'Thin Film Stress Measurement',
  description: 'Calculate film stress from substrate curvature using the Stoney equation. Includes thermal stress decomposition and stored elastic energy.'
};
const jsonLd = generateCalculatorJsonLd(
  `Thin Film Stress Measurement',
  description: 'Calculate film stress from substrate curvature using the Stoney equation. Includes thermal stress decomposition and stored elastic energy.'
};


const jsonLd = generateCalculatorJsonLd(
  'Thin Film Stress Measurement',
  'Calculate film stress from substrate curvature using the Stoney equation. Includes thermal stress decomposition and stored elastic energy.',
  'https://photonics-calculators.vercel.app/thin-film/stress-measurement',
  { category: 'Thin Film`,
  `Calculate film stress from substrate curvature using the Stoney equation. Includes thermal stress decomposition and stored elastic energy.'
};


const jsonLd = generateCalculatorJsonLd(
  'Thin Film Stress Measurement',
  'Calculate film stress from substrate curvature using the Stoney equation. Includes thermal stress decomposition and stored elastic energy.',
  'https://photonics-calculators.vercel.app/thin-film/stress-measurement',
  { category: 'Thin Film`,
  `https://photonics-calculators.vercel.app/thin-film/stress-measurement`,
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
