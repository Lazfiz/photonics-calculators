import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/fiber-optics/dispersion-shifted' },
    title: 'Dispersion-Shifted Fiber Calculator',
    description: 'Compare DSF, NZ-DSF, and DCF dispersion characteristics.'
};

const jsonLd = generateCalculatorJsonLd(
  'Dispersion-Shifted Fiber Calculator',
  'Compare DSF, NZ-DSF, and DCF dispersion characteristics.',
  'https://photonics-calculators.vercel.app/fiber-optics/dispersion-shifted',
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
