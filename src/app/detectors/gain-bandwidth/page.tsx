import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/detectors/gain-bandwidth' },
      title: 'Gain-Bandwidth Product',
  description: 'GBW = A₀ f₋₃dB. The product of DC gain and bandwidth is constant for a single-pole system.',
};
const jsonLd = generateCalculatorJsonLd(
  `Gain-Bandwidth Product',
  description: 'GBW = A₀ f₋₃dB. The product of DC gain and bandwidth is constant for a single-pole system.',
};


const jsonLd = generateCalculatorJsonLd(
  'Gain-Bandwidth Product',
  'GBW = A₀ f₋₃dB. The product of DC gain and bandwidth is constant for a single-pole system.',
  'https://photonics-calculators.vercel.app/detectors/gain-bandwidth',
  { category: 'Detectors`,
  `GBW = A₀ f₋₃dB. The product of DC gain and bandwidth is constant for a single-pole system.',
};


const jsonLd = generateCalculatorJsonLd(
  'Gain-Bandwidth Product',
  'GBW = A₀ f₋₃dB. The product of DC gain and bandwidth is constant for a single-pole system.',
  'https://photonics-calculators.vercel.app/detectors/gain-bandwidth',
  { category: 'Detectors`,
  `https://photonics-calculators.vercel.app/detectors/gain-bandwidth`,
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
