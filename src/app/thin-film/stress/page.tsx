import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/thin-film/stress' },
    title: 'Coating Stress & Curvature',
  description: 'Stoney',
};
const jsonLd = generateCalculatorJsonLd(
  `Coating Stress & Curvature',
  description: 'Stoney',
};


const jsonLd = generateCalculatorJsonLd(
  'Coating Stress & Curvature',
  'Stoney',
  'https://photonics-calculators.vercel.app/thin-film/stress',
  { category: 'Thin Film`,
  `Stoney',
};


const jsonLd = generateCalculatorJsonLd(
  'Coating Stress & Curvature',
  'Stoney',
  'https://photonics-calculators.vercel.app/thin-film/stress',
  { category: 'Thin Film`,
  `https://photonics-calculators.vercel.app/thin-film/stress`,
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
