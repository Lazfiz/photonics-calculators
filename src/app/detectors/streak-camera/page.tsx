import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/detectors/streak-camera' },
    title: 'Streak Camera',
  description: 'Streak camera basics calculator. Models temporal resolution, sweep speed, time window, and spatial resolution trade-offs.'
};
const jsonLd = generateCalculatorJsonLd(
  `Streak Camera',
  description: 'Streak camera basics calculator. Models temporal resolution, sweep speed, time window, and spatial resolution trade-offs.'
};


const jsonLd = generateCalculatorJsonLd(
  'Streak Camera',
  'Streak camera basics calculator. Models temporal resolution, sweep speed, time window, and spatial resolution trade-offs.',
  'https://photonics-calculators.vercel.app/detectors/streak-camera',
  { category: 'Detectors`,
  `Streak camera basics calculator. Models temporal resolution, sweep speed, time window, and spatial resolution trade-offs.'
};


const jsonLd = generateCalculatorJsonLd(
  'Streak Camera',
  'Streak camera basics calculator. Models temporal resolution, sweep speed, time window, and spatial resolution trade-offs.',
  'https://photonics-calculators.vercel.app/detectors/streak-camera',
  { category: 'Detectors`,
  `https://photonics-calculators.vercel.app/detectors/streak-camera`,
  { category: `Detectors` }
);
export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}
