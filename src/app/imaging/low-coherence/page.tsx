import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/imaging/low-coherence' },
    title: 'Low Coherence Interferometry',
  description: 'Interferogram modelling, coherence gating, fringe visibility, and depth scanning parameters.'
};
const jsonLd = generateCalculatorJsonLd(
  `Low Coherence Interferometry',
  description: 'Interferogram modelling, coherence gating, fringe visibility, and depth scanning parameters.'
};


const jsonLd = generateCalculatorJsonLd(
  'Low Coherence Interferometry',
  'Interferogram modelling, coherence gating, fringe visibility, and depth scanning parameters.',
  'https://photonics-calculators.vercel.app/imaging/low-coherence',
  { category: 'Imaging`,
  `Interferogram modelling, coherence gating, fringe visibility, and depth scanning parameters.'
};


const jsonLd = generateCalculatorJsonLd(
  'Low Coherence Interferometry',
  'Interferogram modelling, coherence gating, fringe visibility, and depth scanning parameters.',
  'https://photonics-calculators.vercel.app/imaging/low-coherence',
  { category: 'Imaging`,
  `https://photonics-calculators.vercel.app/imaging/low-coherence`,
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
