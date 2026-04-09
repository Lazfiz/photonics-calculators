import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/detectors/shot-noise' },
    title: 'Shot Noise',
  description: 'Interactive Shot Noise calculator for photonics and optical engineering.'
};
const jsonLd = generateCalculatorJsonLd(
  `Shot Noise',
  description: 'Interactive Shot Noise calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Shot Noise',
  'Interactive Shot Noise calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/detectors/shot-noise',
  { category: 'Detectors`,
  `Interactive Shot Noise calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Shot Noise',
  'Interactive Shot Noise calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/detectors/shot-noise',
  { category: 'Detectors`,
  `https://photonics-calculators.vercel.app/detectors/shot-noise`,
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
