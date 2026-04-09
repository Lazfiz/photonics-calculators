import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/materials/diamond-optics' },
    title: 'Diamond Optics',
  description: 'Diamond — the ultimate optical material. Bandgap: 5.47 eV. n 2.42.'
};
const jsonLd = generateCalculatorJsonLd(
  `Diamond Optics',
  description: 'Diamond — the ultimate optical material. Bandgap: 5.47 eV. n 2.42.'
};


const jsonLd = generateCalculatorJsonLd(
  'Diamond Optics',
  'Diamond — the ultimate optical material. Bandgap: 5.47 eV. n 2.42.',
  'https://photonics-calculators.vercel.app/materials/diamond-optics',
  { category: 'Materials`,
  `Diamond — the ultimate optical material. Bandgap: 5.47 eV. n 2.42.'
};


const jsonLd = generateCalculatorJsonLd(
  'Diamond Optics',
  'Diamond — the ultimate optical material. Bandgap: 5.47 eV. n 2.42.',
  'https://photonics-calculators.vercel.app/materials/diamond-optics',
  { category: 'Materials`,
  `https://photonics-calculators.vercel.app/materials/diamond-optics`,
  { category: `Materials` }
);
export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}
