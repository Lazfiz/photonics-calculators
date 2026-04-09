import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/wave-optics/optical-parametric' },
    title: 'OPA / OPO Design',
  description: 'Optical parametric oscillator and amplifier design — tuning curves, thresholds, and gain bandwidth.'
};
const jsonLd = generateCalculatorJsonLd(
  `OPA / OPO Design',
  description: 'Optical parametric oscillator and amplifier design — tuning curves, thresholds, and gain bandwidth.'
};


const jsonLd = generateCalculatorJsonLd(
  'OPA / OPO Design',
  'Optical parametric oscillator and amplifier design — tuning curves, thresholds, and gain bandwidth.',
  'https://photonics-calculators.vercel.app/wave-optics/optical-parametric',
  { category: 'Wave Optics`,
  `Optical parametric oscillator and amplifier design — tuning curves, thresholds, and gain bandwidth.'
};


const jsonLd = generateCalculatorJsonLd(
  'OPA / OPO Design',
  'Optical parametric oscillator and amplifier design — tuning curves, thresholds, and gain bandwidth.',
  'https://photonics-calculators.vercel.app/wave-optics/optical-parametric',
  { category: 'Wave Optics`,
  `https://photonics-calculators.vercel.app/wave-optics/optical-parametric`,
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
