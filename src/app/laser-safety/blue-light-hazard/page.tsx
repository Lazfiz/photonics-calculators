import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/laser-safety/blue-light-hazard' },
    title: 'Blue Light Hazard',
  description: 'Simplified educational estimate of B(λ)-weighted blue-light irradiance and risk group. Not for safety decisions; use IEC 62471.'
};

const jsonLd = generateCalculatorJsonLd(
  'Blue Light Hazard',
  'Simplified educational estimate of B(λ)-weighted blue-light irradiance and risk group. Not for safety decisions; use IEC 62471.',
  'https://photonics-calculators.vercel.app/laser-safety/blue-light-hazard',
  { category: 'Laser Safety' }
);

export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}
