import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/detectors/spad' },
    title: 'SPAD Detector Calculator',
  description: 'Single-photon avalanche diode — PDE, DCR, dead time, afterpulsing, and SNR analysis.'
};
const jsonLd = generateCalculatorJsonLd(
  `SPAD Detector Calculator',
  description: 'Single-photon avalanche diode — PDE, DCR, dead time, afterpulsing, and SNR analysis.'
};


const jsonLd = generateCalculatorJsonLd(
  'SPAD Detector Calculator',
  'Single-photon avalanche diode — PDE, DCR, dead time, afterpulsing, and SNR analysis.',
  'https://photonics-calculators.vercel.app/detectors/spad',
  { category: 'Detectors`,
  `Single-photon avalanche diode — PDE, DCR, dead time, afterpulsing, and SNR analysis.'
};


const jsonLd = generateCalculatorJsonLd(
  'SPAD Detector Calculator',
  'Single-photon avalanche diode — PDE, DCR, dead time, afterpulsing, and SNR analysis.',
  'https://photonics-calculators.vercel.app/detectors/spad',
  { category: 'Detectors`,
  `https://photonics-calculators.vercel.app/detectors/spad`,
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
