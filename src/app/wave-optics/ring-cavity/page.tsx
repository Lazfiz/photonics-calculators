import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/wave-optics/ring-cavity' },
    title: 'Ring Resonator Design',
  description: 'Ring cavity stability, modes, and spectral analysis.'
};
const jsonLd = generateCalculatorJsonLd(
  `Ring Resonator Design',
  description: 'Ring cavity stability, modes, and spectral analysis.'
};


const jsonLd = generateCalculatorJsonLd(
  'Ring Resonator Design',
  'Ring cavity stability, modes, and spectral analysis.',
  'https://photonics-calculators.vercel.app/wave-optics/ring-cavity',
  { category: 'Wave Optics`,
  `Ring cavity stability, modes, and spectral analysis.'
};


const jsonLd = generateCalculatorJsonLd(
  'Ring Resonator Design',
  'Ring cavity stability, modes, and spectral analysis.',
  'https://photonics-calculators.vercel.app/wave-optics/ring-cavity',
  { category: 'Wave Optics`,
  `https://photonics-calculators.vercel.app/wave-optics/ring-cavity`,
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
