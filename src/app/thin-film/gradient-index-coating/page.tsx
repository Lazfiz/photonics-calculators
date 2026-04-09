import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/thin-film/gradient-index-coating' },
    title: 'Gradient Index Coating',
  description: 'Gradient-index (GRIN) antireflection coatings use a continuously varying refractive index to suppress Fresnel reflections over a broad bandwidth.'
};
const jsonLd = generateCalculatorJsonLd(
  `Gradient Index Coating',
  description: 'Gradient-index (GRIN) antireflection coatings use a continuously varying refractive index to suppress Fresnel reflections over a broad bandwidth.'
};


const jsonLd = generateCalculatorJsonLd(
  'Gradient Index Coating',
  'Gradient-index (GRIN) antireflection coatings use a continuously varying refractive index to suppress Fresnel reflections over a broad bandwidth.',
  'https://photonics-calculators.vercel.app/thin-film/gradient-index-coating',
  { category: 'Thin Film`,
  `Gradient-index (GRIN) antireflection coatings use a continuously varying refractive index to suppress Fresnel reflections over a broad bandwidth.'
};


const jsonLd = generateCalculatorJsonLd(
  'Gradient Index Coating',
  'Gradient-index (GRIN) antireflection coatings use a continuously varying refractive index to suppress Fresnel reflections over a broad bandwidth.',
  'https://photonics-calculators.vercel.app/thin-film/gradient-index-coating',
  { category: 'Thin Film`,
  `https://photonics-calculators.vercel.app/thin-film/gradient-index-coating`,
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
