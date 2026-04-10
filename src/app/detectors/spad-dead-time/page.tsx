import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/detectors/spad-dead-time' },
    title: 'SPAD Dead Time Calculator',
    description: 'Non-paralyzable and paralyzable dead time models for SPAD detectors.'
};

const jsonLd = generateCalculatorJsonLd(
  'SPAD Dead Time Calculator',
  'Non-paralyzable and paralyzable dead time models for SPAD detectors.',
  'https://photonics-calculators.vercel.app/detectors/spad-dead-time',
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
