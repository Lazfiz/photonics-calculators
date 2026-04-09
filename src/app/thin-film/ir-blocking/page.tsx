import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/thin-film/ir-blocking' },
    title: 'IR Blocking Filter',
  description: 'Long-pass quarter-wave stack reflecting near-IR while transmitting visible light.'
};
const jsonLd = generateCalculatorJsonLd(
  `IR Blocking Filter',
  description: 'Long-pass quarter-wave stack reflecting near-IR while transmitting visible light.'
};


const jsonLd = generateCalculatorJsonLd(
  'IR Blocking Filter',
  'Long-pass quarter-wave stack reflecting near-IR while transmitting visible light.',
  'https://photonics-calculators.vercel.app/thin-film/ir-blocking',
  { category: 'Thin Film`,
  `Long-pass quarter-wave stack reflecting near-IR while transmitting visible light.'
};


const jsonLd = generateCalculatorJsonLd(
  'IR Blocking Filter',
  'Long-pass quarter-wave stack reflecting near-IR while transmitting visible light.',
  'https://photonics-calculators.vercel.app/thin-film/ir-blocking',
  { category: 'Thin Film`,
  `https://photonics-calculators.vercel.app/thin-film/ir-blocking`,
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
