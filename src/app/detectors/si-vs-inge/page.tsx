import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/detectors/si-vs-inge' },
    title: 'Si Vs Inge',
  description: 'Interactive Si Vs Inge calculator for photonics and optical engineering.'
};
const jsonLd = generateCalculatorJsonLd(
  `Si Vs Inge',
  description: 'Interactive Si Vs Inge calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Si Vs Inge',
  'Interactive Si Vs Inge calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/detectors/si-vs-inge',
  { category: 'Detectors`,
  `Interactive Si Vs Inge calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Si Vs Inge',
  'Interactive Si Vs Inge calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/detectors/si-vs-inge',
  { category: 'Detectors`,
  `https://photonics-calculators.vercel.app/detectors/si-vs-inge`,
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
