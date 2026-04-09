import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/spectroscopy/time-resolved' },
    title: 'Time-Resolved Spectroscopy',
  description: 'TCSPC and streak camera fundamentals. IRF convolution, temporal resolution, and decay analysis.'
};
const jsonLd = generateCalculatorJsonLd(
  `Time-Resolved Spectroscopy',
  description: 'TCSPC and streak camera fundamentals. IRF convolution, temporal resolution, and decay analysis.'
};


const jsonLd = generateCalculatorJsonLd(
  'Time-Resolved Spectroscopy',
  'TCSPC and streak camera fundamentals. IRF convolution, temporal resolution, and decay analysis.',
  'https://photonics-calculators.vercel.app/spectroscopy/time-resolved',
  { category: 'Spectroscopy`,
  `TCSPC and streak camera fundamentals. IRF convolution, temporal resolution, and decay analysis.'
};


const jsonLd = generateCalculatorJsonLd(
  'Time-Resolved Spectroscopy',
  'TCSPC and streak camera fundamentals. IRF convolution, temporal resolution, and decay analysis.',
  'https://photonics-calculators.vercel.app/spectroscopy/time-resolved',
  { category: 'Spectroscopy`,
  `https://photonics-calculators.vercel.app/spectroscopy/time-resolved`,
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
