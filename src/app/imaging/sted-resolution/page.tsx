import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/imaging/sted-resolution' },
    title: 'STED Super-Resolution Calculator',
  description: 'Calculate STED (Stimulated Emission Depletion) microscopy resolution based on saturation intensity and depletion parameters.'
};
const jsonLd = generateCalculatorJsonLd(
  `STED Super-Resolution Calculator',
  description: 'Calculate STED (Stimulated Emission Depletion) microscopy resolution based on saturation intensity and depletion parameters.'
};


const jsonLd = generateCalculatorJsonLd(
  'STED Super-Resolution Calculator',
  'Calculate STED (Stimulated Emission Depletion) microscopy resolution based on saturation intensity and depletion parameters.',
  'https://photonics-calculators.vercel.app/imaging/sted-resolution',
  { category: 'Imaging`,
  `Calculate STED (Stimulated Emission Depletion) microscopy resolution based on saturation intensity and depletion parameters.'
};


const jsonLd = generateCalculatorJsonLd(
  'STED Super-Resolution Calculator',
  'Calculate STED (Stimulated Emission Depletion) microscopy resolution based on saturation intensity and depletion parameters.',
  'https://photonics-calculators.vercel.app/imaging/sted-resolution',
  { category: 'Imaging`,
  `https://photonics-calculators.vercel.app/imaging/sted-resolution`,
  { category: `Imaging` }
);
export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}
