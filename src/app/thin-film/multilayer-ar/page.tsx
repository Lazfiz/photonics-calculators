import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/thin-film/multilayer-ar' },
    title: 'Two-Layer AR Coating',
  description: 'Design a two-layer anti-reflection coating. Optimal condition: n = nnsub.'
};
const jsonLd = generateCalculatorJsonLd(
  `Two-Layer AR Coating',
  description: 'Design a two-layer anti-reflection coating. Optimal condition: n = nnsub.'
};


const jsonLd = generateCalculatorJsonLd(
  'Two-Layer AR Coating',
  'Design a two-layer anti-reflection coating. Optimal condition: n = nnsub.',
  'https://photonics-calculators.vercel.app/thin-film/multilayer-ar',
  { category: 'Thin Film`,
  `Design a two-layer anti-reflection coating. Optimal condition: n = nnsub.'
};


const jsonLd = generateCalculatorJsonLd(
  'Two-Layer AR Coating',
  'Design a two-layer anti-reflection coating. Optimal condition: n = nnsub.',
  'https://photonics-calculators.vercel.app/thin-film/multilayer-ar',
  { category: 'Thin Film`,
  `https://photonics-calculators.vercel.app/thin-film/multilayer-ar`,
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
