import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/detectors/lockin-amplifier' },
    title: 'Lockin Amplifier',
  description: 'Interactive Lockin Amplifier calculator for photonics and optical engineering.'
};
const jsonLd = generateCalculatorJsonLd(
  `Lockin Amplifier',
  description: 'Interactive Lockin Amplifier calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Lockin Amplifier',
  'Interactive Lockin Amplifier calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/detectors/lockin-amplifier',
  { category: 'Detectors`,
  `Interactive Lockin Amplifier calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Lockin Amplifier',
  'Interactive Lockin Amplifier calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/detectors/lockin-amplifier',
  { category: 'Detectors`,
  `https://photonics-calculators.vercel.app/detectors/lockin-amplifier`,
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
