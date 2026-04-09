import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/thin-film/wide-bandpass' },
    title: 'Wide Bandpass Filter',
  description: 'Cascaded short-pass + long-pass quarter-wave stacks for broad transmission bands.'
};
const jsonLd = generateCalculatorJsonLd(
  `Wide Bandpass Filter',
  description: 'Cascaded short-pass + long-pass quarter-wave stacks for broad transmission bands.'
};


const jsonLd = generateCalculatorJsonLd(
  'Wide Bandpass Filter',
  'Cascaded short-pass + long-pass quarter-wave stacks for broad transmission bands.',
  'https://photonics-calculators.vercel.app/thin-film/wide-bandpass',
  { category: 'Thin Film`,
  `Cascaded short-pass + long-pass quarter-wave stacks for broad transmission bands.'
};


const jsonLd = generateCalculatorJsonLd(
  'Wide Bandpass Filter',
  'Cascaded short-pass + long-pass quarter-wave stacks for broad transmission bands.',
  'https://photonics-calculators.vercel.app/thin-film/wide-bandpass',
  { category: 'Thin Film`,
  `https://photonics-calculators.vercel.app/thin-film/wide-bandpass`,
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
