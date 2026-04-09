import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/thin-film/gradient-index' },
    title: 'Gradient Index Coating',
  description: 'Continuously graded refractive index coating — broadband AR with no sharp interfaces.'
};
const jsonLd = generateCalculatorJsonLd(
  `Gradient Index Coating',
  description: 'Continuously graded refractive index coating — broadband AR with no sharp interfaces.'
};


const jsonLd = generateCalculatorJsonLd(
  'Gradient Index Coating',
  'Continuously graded refractive index coating — broadband AR with no sharp interfaces.',
  'https://photonics-calculators.vercel.app/thin-film/gradient-index',
  { category: 'Thin Film`,
  `Continuously graded refractive index coating — broadband AR with no sharp interfaces.'
};


const jsonLd = generateCalculatorJsonLd(
  'Gradient Index Coating',
  'Continuously graded refractive index coating — broadband AR with no sharp interfaces.',
  'https://photonics-calculators.vercel.app/thin-film/gradient-index',
  { category: 'Thin Film`,
  `https://photonics-calculators.vercel.app/thin-film/gradient-index`,
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
