import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/thin-film/interference-conditions' },
    title: 'Thin Film Interference Conditions',
  description: 'Constructive and destructive interference patterns from a single thin film, accounting for phase shifts at boundaries.'
};
const jsonLd = generateCalculatorJsonLd(
  `Thin Film Interference Conditions',
  description: 'Constructive and destructive interference patterns from a single thin film, accounting for phase shifts at boundaries.'
};


const jsonLd = generateCalculatorJsonLd(
  'Thin Film Interference Conditions',
  'Constructive and destructive interference patterns from a single thin film, accounting for phase shifts at boundaries.',
  'https://photonics-calculators.vercel.app/thin-film/interference-conditions',
  { category: 'Thin Film`,
  `Constructive and destructive interference patterns from a single thin film, accounting for phase shifts at boundaries.'
};


const jsonLd = generateCalculatorJsonLd(
  'Thin Film Interference Conditions',
  'Constructive and destructive interference patterns from a single thin film, accounting for phase shifts at boundaries.',
  'https://photonics-calculators.vercel.app/thin-film/interference-conditions',
  { category: 'Thin Film`,
  `https://photonics-calculators.vercel.app/thin-film/interference-conditions`,
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
