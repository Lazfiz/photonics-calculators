import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/imaging/wavefront-sensing' },
    title: 'Wavefront Sensing',
  description: 'Wavefront error analysis, Zernike decomposition, Strehl ratio, and sensor sensitivity.'
};
const jsonLd = generateCalculatorJsonLd(
  `Wavefront Sensing',
  description: 'Wavefront error analysis, Zernike decomposition, Strehl ratio, and sensor sensitivity.'
};


const jsonLd = generateCalculatorJsonLd(
  'Wavefront Sensing',
  'Wavefront error analysis, Zernike decomposition, Strehl ratio, and sensor sensitivity.',
  'https://photonics-calculators.vercel.app/imaging/wavefront-sensing',
  { category: 'Imaging`,
  `Wavefront error analysis, Zernike decomposition, Strehl ratio, and sensor sensitivity.'
};


const jsonLd = generateCalculatorJsonLd(
  'Wavefront Sensing',
  'Wavefront error analysis, Zernike decomposition, Strehl ratio, and sensor sensitivity.',
  'https://photonics-calculators.vercel.app/imaging/wavefront-sensing',
  { category: 'Imaging`,
  `https://photonics-calculators.vercel.app/imaging/wavefront-sensing`,
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
