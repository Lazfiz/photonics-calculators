import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/thin-film/short-pass' },
      title: 'Short Pass Filter',
  description: 'Quarter-wave stack (LH)N short-pass filter. Transmits < edge, reflects longer wavelengths.',
};
const jsonLd = generateCalculatorJsonLd(
  `Short Pass Filter',
  description: 'Quarter-wave stack (LH)N short-pass filter. Transmits < edge, reflects longer wavelengths.',
};


const jsonLd = generateCalculatorJsonLd(
  'Short Pass Filter',
  'Quarter-wave stack (LH)N short-pass filter. Transmits < edge, reflects longer wavelengths.',
  'https://photonics-calculators.vercel.app/thin-film/short-pass',
  { category: 'Thin Film`,
  `Quarter-wave stack (LH)N short-pass filter. Transmits < edge, reflects longer wavelengths.',
};


const jsonLd = generateCalculatorJsonLd(
  'Short Pass Filter',
  'Quarter-wave stack (LH)N short-pass filter. Transmits < edge, reflects longer wavelengths.',
  'https://photonics-calculators.vercel.app/thin-film/short-pass',
  { category: 'Thin Film`,
  `https://photonics-calculators.vercel.app/thin-film/short-pass`,
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
