import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/detectors/well-capacity' },
    title: 'Well Capacity & Dynamic Range Calculator',
    description: 'Well capacity, dynamic range, pixel capacitance, and usable bit depth for image sensors.'
};

const jsonLd = generateCalculatorJsonLd(
  'Well Capacity & Dynamic Range Calculator',
  'Well capacity, dynamic range, pixel capacitance, and usable bit depth for image sensors.',
  'https://photonics-calculators.vercel.app/detectors/well-capacity',
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
