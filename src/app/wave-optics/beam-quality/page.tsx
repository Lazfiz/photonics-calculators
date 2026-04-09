import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/wave-optics/beam-quality' },
    title: 'Beam Quality M² Measurement',
  description: 'Detailed beam quality analysis from measured parameters.'
};
const jsonLd = generateCalculatorJsonLd(
  `Beam Quality M² Measurement',
  description: 'Detailed beam quality analysis from measured parameters.'
};


const jsonLd = generateCalculatorJsonLd(
  'Beam Quality M² Measurement',
  'Detailed beam quality analysis from measured parameters.',
  'https://photonics-calculators.vercel.app/wave-optics/beam-quality',
  { category: 'Wave Optics`,
  `Detailed beam quality analysis from measured parameters.'
};


const jsonLd = generateCalculatorJsonLd(
  'Beam Quality M² Measurement',
  'Detailed beam quality analysis from measured parameters.',
  'https://photonics-calculators.vercel.app/wave-optics/beam-quality',
  { category: 'Wave Optics`,
  `https://photonics-calculators.vercel.app/wave-optics/beam-quality`,
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
