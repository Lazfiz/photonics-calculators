import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/fiber-optics/dispersion-comp' },
    title: 'Dispersion Compensation Calculator',
    description: 'Calculates chromatic dispersion limits and DCF (dispersion-compensating fiber) requirements.'
};

const jsonLd = generateCalculatorJsonLd(
  'Dispersion Compensation Calculator',
  'Calculates chromatic dispersion limits and DCF (dispersion-compensating fiber) requirements.',
  'https://photonics-calculators.vercel.app/fiber-optics/dispersion-comp',
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
