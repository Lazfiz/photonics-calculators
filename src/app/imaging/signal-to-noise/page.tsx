import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/imaging/signal-to-noise' },
    title: 'Imaging Signal-to-Noise Ratio',
  description: 'Comprehensive SNR calculation for microscopy imaging systems.'
};
const jsonLd = generateCalculatorJsonLd(
  `Imaging Signal-to-Noise Ratio',
  description: 'Comprehensive SNR calculation for microscopy imaging systems.'
};


const jsonLd = generateCalculatorJsonLd(
  'Imaging Signal-to-Noise Ratio',
  'Comprehensive SNR calculation for microscopy imaging systems.',
  'https://photonics-calculators.vercel.app/imaging/signal-to-noise',
  { category: 'Imaging`,
  `Comprehensive SNR calculation for microscopy imaging systems.'
};


const jsonLd = generateCalculatorJsonLd(
  'Imaging Signal-to-Noise Ratio',
  'Comprehensive SNR calculation for microscopy imaging systems.',
  'https://photonics-calculators.vercel.app/imaging/signal-to-noise',
  { category: 'Imaging`,
  `https://photonics-calculators.vercel.app/imaging/signal-to-noise`,
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
