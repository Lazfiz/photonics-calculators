import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/detectors/responsivity' },
    title: 'Detector Responsivity',
  description: 'Interactive detector responsivity calculator from quantum efficiency and wavelength, with wavelength sweeps and presets.'
};
const jsonLd = generateCalculatorJsonLd(
  `Detector Responsivity',
  description: 'Interactive detector responsivity calculator from quantum efficiency and wavelength, with wavelength sweeps and presets.'
};


const jsonLd = generateCalculatorJsonLd(
  'Detector Responsivity',
  'Interactive detector responsivity calculator from quantum efficiency and wavelength, with wavelength sweeps and presets.',
  'https://photonics-calculators.vercel.app/detectors/responsivity',
  { category: 'Detectors`,
  `Interactive detector responsivity calculator from quantum efficiency and wavelength, with wavelength sweeps and presets.'
};


const jsonLd = generateCalculatorJsonLd(
  'Detector Responsivity',
  'Interactive detector responsivity calculator from quantum efficiency and wavelength, with wavelength sweeps and presets.',
  'https://photonics-calculators.vercel.app/detectors/responsivity',
  { category: 'Detectors`,
  `https://photonics-calculators.vercel.app/detectors/responsivity`,
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
