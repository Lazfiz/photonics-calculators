import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/imaging/dynamic-range' },
    title: 'Dynamic Range Calculator',
  description: 'Imaging system dynamic range, noise floor, and ADC-limited performance analysis.'
};
const jsonLd = generateCalculatorJsonLd(
  `Dynamic Range Calculator',
  description: 'Imaging system dynamic range, noise floor, and ADC-limited performance analysis.'
};


const jsonLd = generateCalculatorJsonLd(
  'Dynamic Range Calculator',
  'Imaging system dynamic range, noise floor, and ADC-limited performance analysis.',
  'https://photonics-calculators.vercel.app/imaging/dynamic-range',
  { category: 'Imaging`,
  `Imaging system dynamic range, noise floor, and ADC-limited performance analysis.'
};


const jsonLd = generateCalculatorJsonLd(
  'Dynamic Range Calculator',
  'Imaging system dynamic range, noise floor, and ADC-limited performance analysis.',
  'https://photonics-calculators.vercel.app/imaging/dynamic-range',
  { category: 'Imaging`,
  `https://photonics-calculators.vercel.app/imaging/dynamic-range`,
  { category: `Imaging` }
);
export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}
