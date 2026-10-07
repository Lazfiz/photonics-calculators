import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/wave-optics/optical-parametric-oscillator' },
    title: 'Optical Parametric Oscillator',
  description: 'Parametric gain, walk-off-limited interaction length and singly-resonant OPO threshold from pump wavelength, d_eff, beam radius and cavity loss.'
};

const jsonLd = generateCalculatorJsonLd(
  'Optical Parametric Oscillator',
  'Parametric gain, walk-off-limited interaction length and singly-resonant OPO threshold from pump wavelength, d_eff, beam radius and cavity loss.',
  'https://photonics-calculators.vercel.app/wave-optics/optical-parametric-oscillator',
  { category: 'Wave Optics' }
);

export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}
