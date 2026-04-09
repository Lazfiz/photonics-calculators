import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/thin-film/phase-shift-coating' },
    title: 'Phase Shift Coatings',
  description: 'Phase shift accumulated in thin film coatings. Explore how film thickness and refractive index affect the optical phase of reflected and transmitted light.'
};
const jsonLd = generateCalculatorJsonLd(
  `Phase Shift Coatings',
  description: 'Phase shift accumulated in thin film coatings. Explore how film thickness and refractive index affect the optical phase of reflected and transmitted light.'
};


const jsonLd = generateCalculatorJsonLd(
  'Phase Shift Coatings',
  'Phase shift accumulated in thin film coatings. Explore how film thickness and refractive index affect the optical phase of reflected and transmitted light.',
  'https://photonics-calculators.vercel.app/thin-film/phase-shift-coating',
  { category: 'Thin Film`,
  `Phase shift accumulated in thin film coatings. Explore how film thickness and refractive index affect the optical phase of reflected and transmitted light.'
};


const jsonLd = generateCalculatorJsonLd(
  'Phase Shift Coatings',
  'Phase shift accumulated in thin film coatings. Explore how film thickness and refractive index affect the optical phase of reflected and transmitted light.',
  'https://photonics-calculators.vercel.app/thin-film/phase-shift-coating',
  { category: 'Thin Film`,
  `https://photonics-calculators.vercel.app/thin-film/phase-shift-coating`,
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
