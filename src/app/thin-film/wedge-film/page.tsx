import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/thin-film/wedge-film' },
      title: 'Wedge Thin Film',
  description: 'Wedged thin films have a linearly varying thickness across the surface, creating spatially',
};
const jsonLd = generateCalculatorJsonLd(
  `Wedge Thin Film',
  description: 'Wedged thin films have a linearly varying thickness across the surface, creating spatially',
};


const jsonLd = generateCalculatorJsonLd(
  'Wedge Thin Film',
  'Wedged thin films have a linearly varying thickness across the surface, creating spatially',
  'https://photonics-calculators.vercel.app/thin-film/wedge-film',
  { category: 'Thin Film`,
  `Wedged thin films have a linearly varying thickness across the surface, creating spatially',
};


const jsonLd = generateCalculatorJsonLd(
  'Wedge Thin Film',
  'Wedged thin films have a linearly varying thickness across the surface, creating spatially',
  'https://photonics-calculators.vercel.app/thin-film/wedge-film',
  { category: 'Thin Film`,
  `https://photonics-calculators.vercel.app/thin-film/wedge-film`,
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
