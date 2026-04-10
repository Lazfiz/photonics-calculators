import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/fiber-optics/fiber-bandwidth' },
    title: 'Fiber Bandwidth Calculator',
    description: 'Calculate bandwidth limitations from chromatic dispersion, modal dispersion, and PMD.'
};

const jsonLd = generateCalculatorJsonLd(
  'Fiber Bandwidth Calculator',
  'Calculate bandwidth limitations from chromatic dispersion, modal dispersion, and PMD.',
  'https://photonics-calculators.vercel.app/fiber-optics/fiber-bandwidth',
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
