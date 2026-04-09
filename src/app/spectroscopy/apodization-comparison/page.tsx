import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/spectroscopy/apodization-comparison' },
    title: 'Apodization Comparison',
  description: 'Compare 9 window functions and their instrument line shapes (ILS). Select windows to overlay.'
};
const jsonLd = generateCalculatorJsonLd(
  `Apodization Comparison',
  description: 'Compare 9 window functions and their instrument line shapes (ILS). Select windows to overlay.'
};


const jsonLd = generateCalculatorJsonLd(
  'Apodization Comparison',
  'Compare 9 window functions and their instrument line shapes (ILS). Select windows to overlay.',
  'https://photonics-calculators.vercel.app/spectroscopy/apodization-comparison',
  { category: 'Spectroscopy`,
  `Compare 9 window functions and their instrument line shapes (ILS). Select windows to overlay.'
};


const jsonLd = generateCalculatorJsonLd(
  'Apodization Comparison',
  'Compare 9 window functions and their instrument line shapes (ILS). Select windows to overlay.',
  'https://photonics-calculators.vercel.app/spectroscopy/apodization-comparison',
  { category: 'Spectroscopy`,
  `https://photonics-calculators.vercel.app/spectroscopy/apodization-comparison`,
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
