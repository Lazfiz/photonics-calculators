import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/thin-film/dual-band-ar' },
    title: 'Dual-Band AR Coating',
  description: 'Three-layer anti-reflection coating optimized for two distinct wavelength bands.'
};
const jsonLd = generateCalculatorJsonLd(
  `Dual-Band AR Coating',
  description: 'Three-layer anti-reflection coating optimized for two distinct wavelength bands.'
};


const jsonLd = generateCalculatorJsonLd(
  'Dual-Band AR Coating',
  'Three-layer anti-reflection coating optimized for two distinct wavelength bands.',
  'https://photonics-calculators.vercel.app/thin-film/dual-band-ar',
  { category: 'Thin Film`,
  `Three-layer anti-reflection coating optimized for two distinct wavelength bands.'
};


const jsonLd = generateCalculatorJsonLd(
  'Dual-Band AR Coating',
  'Three-layer anti-reflection coating optimized for two distinct wavelength bands.',
  'https://photonics-calculators.vercel.app/thin-film/dual-band-ar',
  { category: 'Thin Film`,
  `https://photonics-calculators.vercel.app/thin-film/dual-band-ar`,
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
