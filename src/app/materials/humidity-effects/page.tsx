import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/materials/humidity-effects' },
    title: 'Humidity Effects on Optics',
  description: 'Water absorption, refractive index changes, and surface degradation',
};
const jsonLd = generateCalculatorJsonLd(
  `Humidity Effects on Optics',
  description: 'Water absorption, refractive index changes, and surface degradation',
};


const jsonLd = generateCalculatorJsonLd(
  'Humidity Effects on Optics',
  'Water absorption, refractive index changes, and surface degradation',
  'https://photonics-calculators.vercel.app/materials/humidity-effects',
  { category: 'Materials`,
  `Water absorption, refractive index changes, and surface degradation',
};


const jsonLd = generateCalculatorJsonLd(
  'Humidity Effects on Optics',
  'Water absorption, refractive index changes, and surface degradation',
  'https://photonics-calculators.vercel.app/materials/humidity-effects',
  { category: 'Materials`,
  `https://photonics-calculators.vercel.app/materials/humidity-effects`,
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
