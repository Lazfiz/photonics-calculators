import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/thin-film/hard-coating' },
    title: 'Hard Coating Design',
  description: 'Abrasion-resistant optical coating — balance mechanical hardness with optical performance.'
};
const jsonLd = generateCalculatorJsonLd(
  `Hard Coating Design',
  description: 'Abrasion-resistant optical coating — balance mechanical hardness with optical performance.'
};


const jsonLd = generateCalculatorJsonLd(
  'Hard Coating Design',
  'Abrasion-resistant optical coating — balance mechanical hardness with optical performance.',
  'https://photonics-calculators.vercel.app/thin-film/hard-coating',
  { category: 'Thin Film`,
  `Abrasion-resistant optical coating — balance mechanical hardness with optical performance.'
};


const jsonLd = generateCalculatorJsonLd(
  'Hard Coating Design',
  'Abrasion-resistant optical coating — balance mechanical hardness with optical performance.',
  'https://photonics-calculators.vercel.app/thin-film/hard-coating',
  { category: 'Thin Film`,
  `https://photonics-calculators.vercel.app/thin-film/hard-coating`,
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
