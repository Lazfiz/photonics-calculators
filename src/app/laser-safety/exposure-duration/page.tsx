import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/laser-safety/exposure-duration' },
    title: 'Maximum Safe Exposure Duration',
  description: 'Calculate the maximum safe exposure time for a CW laser beam based on MPE limits.'
};
const jsonLd = generateCalculatorJsonLd(
  `Maximum Safe Exposure Duration',
  description: 'Calculate the maximum safe exposure time for a CW laser beam based on MPE limits.'
};


const jsonLd = generateCalculatorJsonLd(
  'Maximum Safe Exposure Duration',
  'Calculate the maximum safe exposure time for a CW laser beam based on MPE limits.',
  'https://photonics-calculators.vercel.app/laser-safety/exposure-duration',
  { category: 'Laser Safety`,
  `Calculate the maximum safe exposure time for a CW laser beam based on MPE limits.'
};


const jsonLd = generateCalculatorJsonLd(
  'Maximum Safe Exposure Duration',
  'Calculate the maximum safe exposure time for a CW laser beam based on MPE limits.',
  'https://photonics-calculators.vercel.app/laser-safety/exposure-duration',
  { category: 'Laser Safety`,
  `https://photonics-calculators.vercel.app/laser-safety/exposure-duration`,
  { category: `Laser Safety` }
);
export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}
