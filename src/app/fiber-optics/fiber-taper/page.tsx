import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/fiber-optics/fiber-taper' },
    title: 'Fiber Taper Calculation',
  description: 'Calculate fiber taper waist diameter, evanescent field, and coupling parameters from pull length.'
};
const jsonLd = generateCalculatorJsonLd(
  `Fiber Taper Calculation',
  description: 'Calculate fiber taper waist diameter, evanescent field, and coupling parameters from pull length.'
};


const jsonLd = generateCalculatorJsonLd(
  'Fiber Taper Calculation',
  'Calculate fiber taper waist diameter, evanescent field, and coupling parameters from pull length.',
  'https://photonics-calculators.vercel.app/fiber-optics/fiber-taper',
  { category: 'Fiber Optics`,
  `Calculate fiber taper waist diameter, evanescent field, and coupling parameters from pull length.'
};


const jsonLd = generateCalculatorJsonLd(
  'Fiber Taper Calculation',
  'Calculate fiber taper waist diameter, evanescent field, and coupling parameters from pull length.',
  'https://photonics-calculators.vercel.app/fiber-optics/fiber-taper',
  { category: 'Fiber Optics`,
  `https://photonics-calculators.vercel.app/fiber-optics/fiber-taper`,
  { category: `Fiber Optics` }
);
export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}
