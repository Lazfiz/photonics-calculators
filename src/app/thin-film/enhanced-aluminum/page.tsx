import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/thin-film/enhanced-aluminum' },
    title: 'Enhanced Aluminum Mirror',
  description: 'Aluminum mirror with dielectric overcoat to boost reflectance in the visible.'
};
const jsonLd = generateCalculatorJsonLd(
  `Enhanced Aluminum Mirror',
  description: 'Aluminum mirror with dielectric overcoat to boost reflectance in the visible.'
};


const jsonLd = generateCalculatorJsonLd(
  'Enhanced Aluminum Mirror',
  'Aluminum mirror with dielectric overcoat to boost reflectance in the visible.',
  'https://photonics-calculators.vercel.app/thin-film/enhanced-aluminum',
  { category: 'Thin Film`,
  `Aluminum mirror with dielectric overcoat to boost reflectance in the visible.'
};


const jsonLd = generateCalculatorJsonLd(
  'Enhanced Aluminum Mirror',
  'Aluminum mirror with dielectric overcoat to boost reflectance in the visible.',
  'https://photonics-calculators.vercel.app/thin-film/enhanced-aluminum',
  { category: 'Thin Film`,
  `https://photonics-calculators.vercel.app/thin-film/enhanced-aluminum`,
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
