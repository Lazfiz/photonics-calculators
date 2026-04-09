import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/materials/transparency-range' },
    title: 'Transparency Range',
  description: 'UV cutoff to IR cutoff for common optical materials',
};
const jsonLd = generateCalculatorJsonLd(
  `Transparency Range',
  description: 'UV cutoff to IR cutoff for common optical materials',
};


const jsonLd = generateCalculatorJsonLd(
  'Transparency Range',
  'UV cutoff to IR cutoff for common optical materials',
  'https://photonics-calculators.vercel.app/materials/transparency-range',
  { category: 'Materials`,
  `UV cutoff to IR cutoff for common optical materials',
};


const jsonLd = generateCalculatorJsonLd(
  'Transparency Range',
  'UV cutoff to IR cutoff for common optical materials',
  'https://photonics-calculators.vercel.app/materials/transparency-range',
  { category: 'Materials`,
  `https://photonics-calculators.vercel.app/materials/transparency-range`,
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
