import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/imaging/second-harmonic' },
    title: 'Second Harmonic Generation Calculator',
  description: 'SHG signal estimation, coherence length, and phase matching for nonlinear imaging.'
};
const jsonLd = generateCalculatorJsonLd(
  `Second Harmonic Generation Calculator',
  description: 'SHG signal estimation, coherence length, and phase matching for nonlinear imaging.'
};


const jsonLd = generateCalculatorJsonLd(
  'Second Harmonic Generation Calculator',
  'SHG signal estimation, coherence length, and phase matching for nonlinear imaging.',
  'https://photonics-calculators.vercel.app/imaging/second-harmonic',
  { category: 'Imaging`,
  `SHG signal estimation, coherence length, and phase matching for nonlinear imaging.'
};


const jsonLd = generateCalculatorJsonLd(
  'Second Harmonic Generation Calculator',
  'SHG signal estimation, coherence length, and phase matching for nonlinear imaging.',
  'https://photonics-calculators.vercel.app/imaging/second-harmonic',
  { category: 'Imaging`,
  `https://photonics-calculators.vercel.app/imaging/second-harmonic`,
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
