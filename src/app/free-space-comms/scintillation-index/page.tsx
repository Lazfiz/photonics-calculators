import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/free-space-comms/scintillation-index' },
    title: 'Scintillation Index',
  description: 'Interactive Scintillation Index calculator for photonics and optical engineering.'
};
const jsonLd = generateCalculatorJsonLd(
  `Scintillation Index',
  description: 'Interactive Scintillation Index calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Scintillation Index',
  'Interactive Scintillation Index calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/free-space-comms/scintillation-index',
  { category: 'Free Space Comms`,
  `Interactive Scintillation Index calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Scintillation Index',
  'Interactive Scintillation Index calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/free-space-comms/scintillation-index',
  { category: 'Free Space Comms`,
  `https://photonics-calculators.vercel.app/free-space-comms/scintillation-index`,
  { category: `Free Space Comms` }
);
export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}
