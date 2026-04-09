import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/imaging/strehl-ratio' },
    title: 'Strehl Ratio Calculator',
  description: 'Estimate the Strehl ratio from wavefront error using the Maréchal approximation.'
};
const jsonLd = generateCalculatorJsonLd(
  `Strehl Ratio Calculator',
  description: 'Estimate the Strehl ratio from wavefront error using the Maréchal approximation.'
};


const jsonLd = generateCalculatorJsonLd(
  'Strehl Ratio Calculator',
  'Estimate the Strehl ratio from wavefront error using the Maréchal approximation.',
  'https://photonics-calculators.vercel.app/imaging/strehl-ratio',
  { category: 'Imaging`,
  `Estimate the Strehl ratio from wavefront error using the Maréchal approximation.'
};


const jsonLd = generateCalculatorJsonLd(
  'Strehl Ratio Calculator',
  'Estimate the Strehl ratio from wavefront error using the Maréchal approximation.',
  'https://photonics-calculators.vercel.app/imaging/strehl-ratio',
  { category: 'Imaging`,
  `https://photonics-calculators.vercel.app/imaging/strehl-ratio`,
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
