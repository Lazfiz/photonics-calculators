import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/detectors/emccd-gain' },
    title: 'EMCCD Gain Calculator',
  description: 'EM gain stages, excess noise (F=2), and SNR advantage over conventional CCD.'
};
const jsonLd = generateCalculatorJsonLd(
  `EMCCD Gain Calculator',
  description: 'EM gain stages, excess noise (F=2), and SNR advantage over conventional CCD.'
};


const jsonLd = generateCalculatorJsonLd(
  'EMCCD Gain Calculator',
  'EM gain stages, excess noise (F=2), and SNR advantage over conventional CCD.',
  'https://photonics-calculators.vercel.app/detectors/emccd-gain',
  { category: 'Detectors`,
  `EM gain stages, excess noise (F=2), and SNR advantage over conventional CCD.'
};


const jsonLd = generateCalculatorJsonLd(
  'EMCCD Gain Calculator',
  'EM gain stages, excess noise (F=2), and SNR advantage over conventional CCD.',
  'https://photonics-calculators.vercel.app/detectors/emccd-gain',
  { category: 'Detectors`,
  `https://photonics-calculators.vercel.app/detectors/emccd-gain`,
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
