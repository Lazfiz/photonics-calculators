import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/spectroscopy/fluorescence-quantum-yield' },
      title: 'Fluorescence Quantum Yield',
  description: 'Φ = Φ_ref (I_s/I_ref) (A_ref/A_s) (n_s/n_ref)² — comparative method using a reference standard.',
};
const jsonLd = generateCalculatorJsonLd(
  `Fluorescence Quantum Yield',
  description: 'Φ = Φ_ref (I_s/I_ref) (A_ref/A_s) (n_s/n_ref)² — comparative method using a reference standard.',
};


const jsonLd = generateCalculatorJsonLd(
  'Fluorescence Quantum Yield',
  'Φ = Φ_ref (I_s/I_ref) (A_ref/A_s) (n_s/n_ref)² — comparative method using a reference standard.',
  'https://photonics-calculators.vercel.app/spectroscopy/fluorescence-quantum-yield',
  { category: 'Spectroscopy`,
  `Φ = Φ_ref (I_s/I_ref) (A_ref/A_s) (n_s/n_ref)² — comparative method using a reference standard.',
};


const jsonLd = generateCalculatorJsonLd(
  'Fluorescence Quantum Yield',
  'Φ = Φ_ref (I_s/I_ref) (A_ref/A_s) (n_s/n_ref)² — comparative method using a reference standard.',
  'https://photonics-calculators.vercel.app/spectroscopy/fluorescence-quantum-yield',
  { category: 'Spectroscopy`,
  `https://photonics-calculators.vercel.app/spectroscopy/fluorescence-quantum-yield`,
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
