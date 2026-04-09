import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/free-space-comms/diversity-reception' },
    title: 'Diversity Reception',
  description: 'Interactive Diversity Reception calculator for photonics and optical engineering.'
};
const jsonLd = generateCalculatorJsonLd(
  `Diversity Reception',
  description: 'Interactive Diversity Reception calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Diversity Reception',
  'Interactive Diversity Reception calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/free-space-comms/diversity-reception',
  { category: 'Free Space Comms`,
  `Interactive Diversity Reception calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Diversity Reception',
  'Interactive Diversity Reception calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/free-space-comms/diversity-reception',
  { category: 'Free Space Comms`,
  `https://photonics-calculators.vercel.app/free-space-comms/diversity-reception`,
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
