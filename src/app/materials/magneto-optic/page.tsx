import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/materials/magneto-optic' },
    title: 'Magneto-Optic Materials',
  description: 'Faraday rotation, Verdet constants, and isolator design calculations',
};
const jsonLd = generateCalculatorJsonLd(
  `Magneto-Optic Materials',
  description: 'Faraday rotation, Verdet constants, and isolator design calculations',
};


const jsonLd = generateCalculatorJsonLd(
  'Magneto-Optic Materials',
  'Faraday rotation, Verdet constants, and isolator design calculations',
  'https://photonics-calculators.vercel.app/materials/magneto-optic',
  { category: 'Materials`,
  `Faraday rotation, Verdet constants, and isolator design calculations',
};


const jsonLd = generateCalculatorJsonLd(
  'Magneto-Optic Materials',
  'Faraday rotation, Verdet constants, and isolator design calculations',
  'https://photonics-calculators.vercel.app/materials/magneto-optic',
  { category: 'Materials`,
  `https://photonics-calculators.vercel.app/materials/magneto-optic`,
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
