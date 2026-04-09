import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/spectroscopy/fluorescence' },
    title: 'Fluorescence Lifetime',
  description: 'Exponential decay models for fluorescence. Single and bi-exponential fitting.'
};
const jsonLd = generateCalculatorJsonLd(
  `Fluorescence Lifetime',
  description: 'Exponential decay models for fluorescence. Single and bi-exponential fitting.'
};


const jsonLd = generateCalculatorJsonLd(
  'Fluorescence Lifetime',
  'Exponential decay models for fluorescence. Single and bi-exponential fitting.',
  'https://photonics-calculators.vercel.app/spectroscopy/fluorescence',
  { category: 'Spectroscopy`,
  `Exponential decay models for fluorescence. Single and bi-exponential fitting.'
};


const jsonLd = generateCalculatorJsonLd(
  'Fluorescence Lifetime',
  'Exponential decay models for fluorescence. Single and bi-exponential fitting.',
  'https://photonics-calculators.vercel.app/spectroscopy/fluorescence',
  { category: 'Spectroscopy`,
  `https://photonics-calculators.vercel.app/spectroscopy/fluorescence`,
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
