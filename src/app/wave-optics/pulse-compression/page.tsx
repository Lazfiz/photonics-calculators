import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/wave-optics/pulse-compression' },
    title: 'Pulse Compression',
  description: 'Transform-limited pulse compression via chirp compensation.'
};
const jsonLd = generateCalculatorJsonLd(
  `Pulse Compression',
  description: 'Transform-limited pulse compression via chirp compensation.'
};


const jsonLd = generateCalculatorJsonLd(
  'Pulse Compression',
  'Transform-limited pulse compression via chirp compensation.',
  'https://photonics-calculators.vercel.app/wave-optics/pulse-compression',
  { category: 'Wave Optics`,
  `Transform-limited pulse compression via chirp compensation.'
};


const jsonLd = generateCalculatorJsonLd(
  'Pulse Compression',
  'Transform-limited pulse compression via chirp compensation.',
  'https://photonics-calculators.vercel.app/wave-optics/pulse-compression',
  { category: 'Wave Optics`,
  `https://photonics-calculators.vercel.app/wave-optics/pulse-compression`,
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
