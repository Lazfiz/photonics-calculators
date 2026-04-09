import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/wave-optics/optical-parametric-oscillator' },
    title: 'Optical Parametric Oscillator',
  description: 'Interactive Optical Parametric Oscillator calculator for photonics and optical engineering.'
};
const jsonLd = generateCalculatorJsonLd(
  `Optical Parametric Oscillator',
  description: 'Interactive Optical Parametric Oscillator calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Optical Parametric Oscillator',
  'Interactive Optical Parametric Oscillator calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/wave-optics/optical-parametric-oscillator',
  { category: 'Wave Optics`,
  `Interactive Optical Parametric Oscillator calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Optical Parametric Oscillator',
  'Interactive Optical Parametric Oscillator calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/wave-optics/optical-parametric-oscillator',
  { category: 'Wave Optics`,
  `https://photonics-calculators.vercel.app/wave-optics/optical-parametric-oscillator`,
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
