import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/thin-film/environmental-stability' },
      title: 'Environmental Stability',
  description: 'Environmental factors shift thin film spectral performance. Temperature changes refractive index',
};
const jsonLd = generateCalculatorJsonLd(
  `Environmental Stability',
  description: 'Environmental factors shift thin film spectral performance. Temperature changes refractive index',
};


const jsonLd = generateCalculatorJsonLd(
  'Environmental Stability',
  'Environmental factors shift thin film spectral performance. Temperature changes refractive index',
  'https://photonics-calculators.vercel.app/thin-film/environmental-stability',
  { category: 'Thin Film`,
  `Environmental factors shift thin film spectral performance. Temperature changes refractive index',
};


const jsonLd = generateCalculatorJsonLd(
  'Environmental Stability',
  'Environmental factors shift thin film spectral performance. Temperature changes refractive index',
  'https://photonics-calculators.vercel.app/thin-film/environmental-stability',
  { category: 'Thin Film`,
  `https://photonics-calculators.vercel.app/thin-film/environmental-stability`,
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
