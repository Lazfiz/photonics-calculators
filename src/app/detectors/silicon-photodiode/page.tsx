import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/detectors/silicon-photodiode' },
    title: 'Silicon Photodiode',
  description: 'Interactive Silicon Photodiode calculator for photonics and optical engineering.'
};
const jsonLd = generateCalculatorJsonLd(
  `Silicon Photodiode',
  description: 'Interactive Silicon Photodiode calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Silicon Photodiode',
  'Interactive Silicon Photodiode calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/detectors/silicon-photodiode',
  { category: 'Detectors`,
  `Interactive Silicon Photodiode calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Silicon Photodiode',
  'Interactive Silicon Photodiode calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/detectors/silicon-photodiode',
  { category: 'Detectors`,
  `https://photonics-calculators.vercel.app/detectors/silicon-photodiode`,
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
