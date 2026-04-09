import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/materials/fluoride-glass' },
    title: 'Fluoride Glass (ZBLAN)',
  description: 'Heavy-metal fluoride glasses for mid-IR fiber optics and low-loss transmission',
};
const jsonLd = generateCalculatorJsonLd(
  `Fluoride Glass (ZBLAN)',
  description: 'Heavy-metal fluoride glasses for mid-IR fiber optics and low-loss transmission',
};


const jsonLd = generateCalculatorJsonLd(
  'Fluoride Glass (ZBLAN)',
  'Heavy-metal fluoride glasses for mid-IR fiber optics and low-loss transmission',
  'https://photonics-calculators.vercel.app/materials/fluoride-glass',
  { category: 'Materials`,
  `Heavy-metal fluoride glasses for mid-IR fiber optics and low-loss transmission',
};


const jsonLd = generateCalculatorJsonLd(
  'Fluoride Glass (ZBLAN)',
  'Heavy-metal fluoride glasses for mid-IR fiber optics and low-loss transmission',
  'https://photonics-calculators.vercel.app/materials/fluoride-glass',
  { category: 'Materials`,
  `https://photonics-calculators.vercel.app/materials/fluoride-glass`,
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
