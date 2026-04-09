import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/spectroscopy/phase-correction' },
    title: 'Phase Correction Methods',
  description: 'Compare Mertz, Forman, and power spectrum methods for interferogram phase correction (FTIR).',
};
const jsonLd = generateCalculatorJsonLd(
  `Phase Correction Methods',
  description: 'Compare Mertz, Forman, and power spectrum methods for interferogram phase correction (FTIR).',
};


const jsonLd = generateCalculatorJsonLd(
  'Phase Correction Methods',
  'Compare Mertz, Forman, and power spectrum methods for interferogram phase correction (FTIR).',
  'https://photonics-calculators.vercel.app/spectroscopy/phase-correction',
  { category: 'Spectroscopy`,
  `Compare Mertz, Forman, and power spectrum methods for interferogram phase correction (FTIR).',
};


const jsonLd = generateCalculatorJsonLd(
  'Phase Correction Methods',
  'Compare Mertz, Forman, and power spectrum methods for interferogram phase correction (FTIR).',
  'https://photonics-calculators.vercel.app/spectroscopy/phase-correction',
  { category: 'Spectroscopy`,
  `https://photonics-calculators.vercel.app/spectroscopy/phase-correction`,
  { category: `Spectroscopy` }
);
export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}
