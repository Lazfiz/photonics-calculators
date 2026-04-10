import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/fiber-optics/connector-return' },
    title: 'Connector Return Loss Calculator',
    description: 'Calculates return loss and insertion loss for fiber connectors with air gaps, lateral offsets, and angular misalignment.'
};

const jsonLd = generateCalculatorJsonLd(
  'Connector Return Loss Calculator',
  'Calculates return loss and insertion loss for fiber connectors with air gaps, lateral offsets, and angular misalignment.',
  'https://photonics-calculators.vercel.app/fiber-optics/connector-return',
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
