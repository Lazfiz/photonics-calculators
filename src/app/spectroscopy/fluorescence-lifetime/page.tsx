import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/spectroscopy/fluorescence-lifetime' },
    title: 'Fluorescence Lifetime Calculator',
  description: 'Model single and bi-exponential fluorescence decay curves. Calculate intensity-weighted average lifetimes.'
};
const jsonLd = generateCalculatorJsonLd(
  `Fluorescence Lifetime Calculator',
  description: 'Model single and bi-exponential fluorescence decay curves. Calculate intensity-weighted average lifetimes.'
};


const jsonLd = generateCalculatorJsonLd(
  'Fluorescence Lifetime Calculator',
  'Model single and bi-exponential fluorescence decay curves. Calculate intensity-weighted average lifetimes.',
  'https://photonics-calculators.vercel.app/spectroscopy/fluorescence-lifetime',
  { category: 'Spectroscopy`,
  `Model single and bi-exponential fluorescence decay curves. Calculate intensity-weighted average lifetimes.'
};


const jsonLd = generateCalculatorJsonLd(
  'Fluorescence Lifetime Calculator',
  'Model single and bi-exponential fluorescence decay curves. Calculate intensity-weighted average lifetimes.',
  'https://photonics-calculators.vercel.app/spectroscopy/fluorescence-lifetime',
  { category: 'Spectroscopy`,
  `https://photonics-calculators.vercel.app/spectroscopy/fluorescence-lifetime`,
  { category: `Spectroscopy` }
);
export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}
