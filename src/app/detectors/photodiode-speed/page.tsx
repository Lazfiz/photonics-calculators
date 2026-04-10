import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/detectors/photodiode-speed' },
    title: 'Photodiode Speed & Bandwidth',
    description: 'RC-limited bandwidth, junction capacitance, and NEP vs area for photodiodes.'
};

const jsonLd = generateCalculatorJsonLd(
  'Photodiode Speed & Bandwidth',
  'RC-limited bandwidth, junction capacitance, and NEP vs area for photodiodes.',
  'https://photonics-calculators.vercel.app/detectors/photodiode-speed',
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
