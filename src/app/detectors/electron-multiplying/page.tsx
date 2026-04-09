import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/detectors/electron-multiplying' },
    title: 'EMCCD vs sCMOS',
  description: 'Compare electron-multiplying CCD with sCMOS for low-light imaging.'
};
const jsonLd = generateCalculatorJsonLd(
  `EMCCD vs sCMOS',
  description: 'Compare electron-multiplying CCD with sCMOS for low-light imaging.'
};


const jsonLd = generateCalculatorJsonLd(
  'EMCCD vs sCMOS',
  'Compare electron-multiplying CCD with sCMOS for low-light imaging.',
  'https://photonics-calculators.vercel.app/detectors/electron-multiplying',
  { category: 'Detectors`,
  `Compare electron-multiplying CCD with sCMOS for low-light imaging.'
};


const jsonLd = generateCalculatorJsonLd(
  'EMCCD vs sCMOS',
  'Compare electron-multiplying CCD with sCMOS for low-light imaging.',
  'https://photonics-calculators.vercel.app/detectors/electron-multiplying',
  { category: 'Detectors`,
  `https://photonics-calculators.vercel.app/detectors/electron-multiplying`,
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
