import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/fiber-optics/fiber-taper' },
    title: 'Fiber Taper Calculator',
    description: 'Calculate fiber taper waist diameter, evanescent field penetration, and coupling parameters from pull length.'
};

const jsonLd = generateCalculatorJsonLd(
  'Fiber Taper Calculator',
  'Calculate fiber taper waist diameter, evanescent field penetration, and coupling parameters from pull length.',
  'https://photonics-calculators.vercel.app/fiber-optics/fiber-taper',
  { category: 'Fiber Optics' }
);

export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}
