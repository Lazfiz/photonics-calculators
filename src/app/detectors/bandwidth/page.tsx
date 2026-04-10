import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/detectors/bandwidth' },
    title: 'Bandwidth vs Noise Trade-off',
    description: 'Noise increases with √Δf. Wider bandwidth = faster response but more noise.'
};

const jsonLd = generateCalculatorJsonLd(
  'Bandwidth vs Noise Trade-off',
  'Noise increases with √Δf. Wider bandwidth = faster response but more noise.',
  'https://photonics-calculators.vercel.app/detectors/bandwidth',
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
