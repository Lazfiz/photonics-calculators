import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/detectors/streak-camera' },
    title: 'Streak Camera Calculator',
    description: 'Temporal resolution, sweep speed, time window, and spatial resolution for streak cameras.'
};

const jsonLd = generateCalculatorJsonLd(
  'Streak Camera Calculator',
  'Temporal resolution, sweep speed, time window, and spatial resolution for streak cameras.',
  'https://photonics-calculators.vercel.app/detectors/streak-camera',
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
