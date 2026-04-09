import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/detectors/quantum-efficiency' },
    title: 'Quantum Efficiency',
  description: 'Interactive detector quantum-efficiency explorer with detector presets, fill factor, microlens gain, and wavelength response curves.'
};
const jsonLd = generateCalculatorJsonLd(
  `Quantum Efficiency',
  description: 'Interactive detector quantum-efficiency explorer with detector presets, fill factor, microlens gain, and wavelength response curves.'
};


const jsonLd = generateCalculatorJsonLd(
  'Quantum Efficiency',
  'Interactive detector quantum-efficiency explorer with detector presets, fill factor, microlens gain, and wavelength response curves.',
  'https://photonics-calculators.vercel.app/detectors/quantum-efficiency',
  { category: 'Detectors`,
  `Interactive detector quantum-efficiency explorer with detector presets, fill factor, microlens gain, and wavelength response curves.'
};


const jsonLd = generateCalculatorJsonLd(
  'Quantum Efficiency',
  'Interactive detector quantum-efficiency explorer with detector presets, fill factor, microlens gain, and wavelength response curves.',
  'https://photonics-calculators.vercel.app/detectors/quantum-efficiency',
  { category: 'Detectors`,
  `https://photonics-calculators.vercel.app/detectors/quantum-efficiency`,
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
