import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/wave-optics/kerr-lens' },
    title: 'Kerr Lens Mode Locking',
  description: 'Self-focusing and Kerr-lens effect in nonlinear media for ultrashort pulse generation.'
};
const jsonLd = generateCalculatorJsonLd(
  `Kerr Lens Mode Locking',
  description: 'Self-focusing and Kerr-lens effect in nonlinear media for ultrashort pulse generation.'
};


const jsonLd = generateCalculatorJsonLd(
  'Kerr Lens Mode Locking',
  'Self-focusing and Kerr-lens effect in nonlinear media for ultrashort pulse generation.',
  'https://photonics-calculators.vercel.app/wave-optics/kerr-lens',
  { category: 'Wave Optics`,
  `Self-focusing and Kerr-lens effect in nonlinear media for ultrashort pulse generation.'
};


const jsonLd = generateCalculatorJsonLd(
  'Kerr Lens Mode Locking',
  'Self-focusing and Kerr-lens effect in nonlinear media for ultrashort pulse generation.',
  'https://photonics-calculators.vercel.app/wave-optics/kerr-lens',
  { category: 'Wave Optics`,
  `https://photonics-calculators.vercel.app/wave-optics/kerr-lens`,
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
