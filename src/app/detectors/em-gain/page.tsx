import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/detectors/em-gain' },
    title: 'EMCCD Gain Calculator',
  description: 'EM gain — noise analysis, optimal gain, and SNR comparison.'
};
const jsonLd = generateCalculatorJsonLd(
  `EMCCD Gain Calculator',
  description: 'EM gain — noise analysis, optimal gain, and SNR comparison.'
};


const jsonLd = generateCalculatorJsonLd(
  'EMCCD Gain Calculator',
  'EM gain — noise analysis, optimal gain, and SNR comparison.',
  'https://photonics-calculators.vercel.app/detectors/em-gain',
  { category: 'Detectors`,
  `EM gain — noise analysis, optimal gain, and SNR comparison.'
};


const jsonLd = generateCalculatorJsonLd(
  'EMCCD Gain Calculator',
  'EM gain — noise analysis, optimal gain, and SNR comparison.',
  'https://photonics-calculators.vercel.app/detectors/em-gain',
  { category: 'Detectors`,
  `https://photonics-calculators.vercel.app/detectors/em-gain`,
  { category: `Detectors` }
);
export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}
