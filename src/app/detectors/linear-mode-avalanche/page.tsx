import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/detectors/linear-mode-avalanche' },
    title: 'Linear Mode Avalanche',
    description: 'Interactive Linear Mode Avalanche calculator for photonics and optical engineering.'
};

const jsonLd = generateCalculatorJsonLd(
  'Linear Mode Avalanche',
  'Interactive Linear Mode Avalanche calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/detectors/linear-mode-avalanche',
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
