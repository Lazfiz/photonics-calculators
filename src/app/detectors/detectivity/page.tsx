import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/detectors/detectivity' },
    title: 'Detectivity (D*)',
    description: 'Specific detectivity from NEP, area, and bandwidth. D* = √(A·Δf) / NEP'
};

const jsonLd = generateCalculatorJsonLd(
  'Detectivity (D*)',
  'Specific detectivity from NEP, area, and bandwidth. D* = √(A·Δf) / NEP',
  'https://photonics-calculators.vercel.app/detectors/detectivity',
  { category: 'Detectors' }
);

export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}
