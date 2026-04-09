import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/imaging/wavefront-error' },
    title: 'Wavefront Error Analysis',
  description: 'Analyze wavefront error in waves RMS, compute Strehl ratio, and check diffraction-limited condition.'
};
const jsonLd = generateCalculatorJsonLd(
  `Wavefront Error Analysis',
  description: 'Analyze wavefront error in waves RMS, compute Strehl ratio, and check diffraction-limited condition.'
};


const jsonLd = generateCalculatorJsonLd(
  'Wavefront Error Analysis',
  'Analyze wavefront error in waves RMS, compute Strehl ratio, and check diffraction-limited condition.',
  'https://photonics-calculators.vercel.app/imaging/wavefront-error',
  { category: 'Imaging`,
  `Analyze wavefront error in waves RMS, compute Strehl ratio, and check diffraction-limited condition.'
};


const jsonLd = generateCalculatorJsonLd(
  'Wavefront Error Analysis',
  'Analyze wavefront error in waves RMS, compute Strehl ratio, and check diffraction-limited condition.',
  'https://photonics-calculators.vercel.app/imaging/wavefront-error',
  { category: 'Imaging`,
  `https://photonics-calculators.vercel.app/imaging/wavefront-error`,
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
