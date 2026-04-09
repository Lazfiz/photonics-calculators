import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/free-space-comms/fade-probability' },
    title: 'Fade Probability',
  description: 'Interactive Fade Probability calculator for photonics and optical engineering.'
};
const jsonLd = generateCalculatorJsonLd(
  `Fade Probability',
  description: 'Interactive Fade Probability calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Fade Probability',
  'Interactive Fade Probability calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/free-space-comms/fade-probability',
  { category: 'Free Space Comms`,
  `Interactive Fade Probability calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Fade Probability',
  'Interactive Fade Probability calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/free-space-comms/fade-probability',
  { category: 'Free Space Comms`,
  `https://photonics-calculators.vercel.app/free-space-comms/fade-probability`,
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
