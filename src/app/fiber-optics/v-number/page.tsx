import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/fiber-optics/v-number' },
    title: 'V Number',
  description: 'Interactive V Number calculator for photonics and optical engineering.'
};

const jsonLd = generateCalculatorJsonLd(
  'V Number',
  'Interactive V Number calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/fiber-optics/v-number',
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
