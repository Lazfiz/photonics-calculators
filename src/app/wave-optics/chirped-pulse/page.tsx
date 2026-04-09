import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/wave-optics/chirped-pulse' },
    title: 'Chirped Pulse Amplification (CPA)',
  description: 'Stretch, amplify, compress — bypassing damage thresholds.'
};
const jsonLd = generateCalculatorJsonLd(
  `Chirped Pulse Amplification (CPA)',
  description: 'Stretch, amplify, compress — bypassing damage thresholds.'
};


const jsonLd = generateCalculatorJsonLd(
  'Chirped Pulse Amplification (CPA)',
  'Stretch, amplify, compress — bypassing damage thresholds.',
  'https://photonics-calculators.vercel.app/wave-optics/chirped-pulse',
  { category: 'Wave Optics`,
  `Stretch, amplify, compress — bypassing damage thresholds.'
};


const jsonLd = generateCalculatorJsonLd(
  'Chirped Pulse Amplification (CPA)',
  'Stretch, amplify, compress — bypassing damage thresholds.',
  'https://photonics-calculators.vercel.app/wave-optics/chirped-pulse',
  { category: 'Wave Optics`,
  `https://photonics-calculators.vercel.app/wave-optics/chirped-pulse`,
  { category: `Wave Optics` }
);
export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}
