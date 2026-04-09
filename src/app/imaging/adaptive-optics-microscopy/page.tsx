import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/imaging/adaptive-optics-microscopy' },
    title: 'Adaptive Optics in Microscopy',
  description: 'Wavefront correction, Strehl ratio recovery, and resolution improvement for deep-tissue imaging.'
};
const jsonLd = generateCalculatorJsonLd(
  `Adaptive Optics in Microscopy',
  description: 'Wavefront correction, Strehl ratio recovery, and resolution improvement for deep-tissue imaging.'
};


const jsonLd = generateCalculatorJsonLd(
  'Adaptive Optics in Microscopy',
  'Wavefront correction, Strehl ratio recovery, and resolution improvement for deep-tissue imaging.',
  'https://photonics-calculators.vercel.app/imaging/adaptive-optics-microscopy',
  { category: 'Imaging`,
  `Wavefront correction, Strehl ratio recovery, and resolution improvement for deep-tissue imaging.'
};


const jsonLd = generateCalculatorJsonLd(
  'Adaptive Optics in Microscopy',
  'Wavefront correction, Strehl ratio recovery, and resolution improvement for deep-tissue imaging.',
  'https://photonics-calculators.vercel.app/imaging/adaptive-optics-microscopy',
  { category: 'Imaging`,
  `https://photonics-calculators.vercel.app/imaging/adaptive-optics-microscopy`,
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
