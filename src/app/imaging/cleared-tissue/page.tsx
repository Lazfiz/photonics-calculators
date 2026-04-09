import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/imaging/cleared-tissue' },
    title: 'Cleared Tissue Imaging Calculator',
  description: 'Optical clearing tissue imaging: resolution, transmission, ballistic photon fraction, and RI matching.'
};
const jsonLd = generateCalculatorJsonLd(
  `Cleared Tissue Imaging Calculator',
  description: 'Optical clearing tissue imaging: resolution, transmission, ballistic photon fraction, and RI matching.'
};


const jsonLd = generateCalculatorJsonLd(
  'Cleared Tissue Imaging Calculator',
  'Optical clearing tissue imaging: resolution, transmission, ballistic photon fraction, and RI matching.',
  'https://photonics-calculators.vercel.app/imaging/cleared-tissue',
  { category: 'Imaging`,
  `Optical clearing tissue imaging: resolution, transmission, ballistic photon fraction, and RI matching.'
};


const jsonLd = generateCalculatorJsonLd(
  'Cleared Tissue Imaging Calculator',
  'Optical clearing tissue imaging: resolution, transmission, ballistic photon fraction, and RI matching.',
  'https://photonics-calculators.vercel.app/imaging/cleared-tissue',
  { category: 'Imaging`,
  `https://photonics-calculators.vercel.app/imaging/cleared-tissue`,
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
