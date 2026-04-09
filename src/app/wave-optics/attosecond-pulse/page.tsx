import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/wave-optics/attosecond-pulse' },
    title: 'Attosecond Pulse Generation',
  description: 'High-harmonic generation and isolated attosecond pulse parameters.'
};
const jsonLd = generateCalculatorJsonLd(
  `Attosecond Pulse Generation',
  description: 'High-harmonic generation and isolated attosecond pulse parameters.'
};


const jsonLd = generateCalculatorJsonLd(
  'Attosecond Pulse Generation',
  'High-harmonic generation and isolated attosecond pulse parameters.',
  'https://photonics-calculators.vercel.app/wave-optics/attosecond-pulse',
  { category: 'Wave Optics`,
  `High-harmonic generation and isolated attosecond pulse parameters.'
};


const jsonLd = generateCalculatorJsonLd(
  'Attosecond Pulse Generation',
  'High-harmonic generation and isolated attosecond pulse parameters.',
  'https://photonics-calculators.vercel.app/wave-optics/attosecond-pulse',
  { category: 'Wave Optics`,
  `https://photonics-calculators.vercel.app/wave-optics/attosecond-pulse`,
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
