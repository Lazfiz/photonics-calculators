import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/fiber-optics/splice-loss' },
    title: 'Fiber Splice Loss',
  description: 'Estimate splice/connector loss from lateral offset, angular misalignment, and end-face gap for single-mode fiber.'
};

const jsonLd = generateCalculatorJsonLd(
  'Fiber Splice Loss',
  'Estimate splice/connector loss from lateral offset, angular misalignment, and end-face gap for single-mode fiber.',
  'https://photonics-calculators.vercel.app/fiber-optics/splice-loss',
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
