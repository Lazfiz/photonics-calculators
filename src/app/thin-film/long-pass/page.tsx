import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/thin-film/long-pass' },
      title: 'Long Pass Filter',
  description: 'Quarter-wave stack (HL)N long-pass filter. Transmits > edge, reflects shorter wavelengths.',
};
const jsonLd = generateCalculatorJsonLd(
  `Long Pass Filter',
  description: 'Quarter-wave stack (HL)N long-pass filter. Transmits > edge, reflects shorter wavelengths.',
};


const jsonLd = generateCalculatorJsonLd(
  'Long Pass Filter',
  'Quarter-wave stack (HL)N long-pass filter. Transmits > edge, reflects shorter wavelengths.',
  'https://photonics-calculators.vercel.app/thin-film/long-pass',
  { category: 'Thin Film`,
  `Quarter-wave stack (HL)N long-pass filter. Transmits > edge, reflects shorter wavelengths.',
};


const jsonLd = generateCalculatorJsonLd(
  'Long Pass Filter',
  'Quarter-wave stack (HL)N long-pass filter. Transmits > edge, reflects shorter wavelengths.',
  'https://photonics-calculators.vercel.app/thin-film/long-pass',
  { category: 'Thin Film`,
  `https://photonics-calculators.vercel.app/thin-film/long-pass`,
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
