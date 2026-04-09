import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/thin-film/uv-blocking' },
    title: 'UV Blocking Filter',
  description: 'Quarter-wave stack designed to reflect UV (200–400 nm) while transmitting visible light.'
};
const jsonLd = generateCalculatorJsonLd(
  `UV Blocking Filter',
  description: 'Quarter-wave stack designed to reflect UV (200–400 nm) while transmitting visible light.'
};


const jsonLd = generateCalculatorJsonLd(
  'UV Blocking Filter',
  'Quarter-wave stack designed to reflect UV (200–400 nm) while transmitting visible light.',
  'https://photonics-calculators.vercel.app/thin-film/uv-blocking',
  { category: 'Thin Film`,
  `Quarter-wave stack designed to reflect UV (200–400 nm) while transmitting visible light.'
};


const jsonLd = generateCalculatorJsonLd(
  'UV Blocking Filter',
  'Quarter-wave stack designed to reflect UV (200–400 nm) while transmitting visible light.',
  'https://photonics-calculators.vercel.app/thin-film/uv-blocking',
  { category: 'Thin Film`,
  `https://photonics-calculators.vercel.app/thin-film/uv-blocking`,
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
