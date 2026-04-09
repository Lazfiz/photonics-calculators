import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/detectors/excess-noise' },
    title: 'Excess Noise Factor',
  description: 'APD excess noise vs gain — McIntyre model for different semiconductor materials.'
};
const jsonLd = generateCalculatorJsonLd(
  `Excess Noise Factor',
  description: 'APD excess noise vs gain — McIntyre model for different semiconductor materials.'
};


const jsonLd = generateCalculatorJsonLd(
  'Excess Noise Factor',
  'APD excess noise vs gain — McIntyre model for different semiconductor materials.',
  'https://photonics-calculators.vercel.app/detectors/excess-noise',
  { category: 'Detectors`,
  `APD excess noise vs gain — McIntyre model for different semiconductor materials.'
};


const jsonLd = generateCalculatorJsonLd(
  'Excess Noise Factor',
  'APD excess noise vs gain — McIntyre model for different semiconductor materials.',
  'https://photonics-calculators.vercel.app/detectors/excess-noise',
  { category: 'Detectors`,
  `https://photonics-calculators.vercel.app/detectors/excess-noise`,
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
