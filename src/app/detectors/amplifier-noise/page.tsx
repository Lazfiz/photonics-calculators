import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/detectors/amplifier-noise' },
    title: 'Amplifier Noise',
    description: 'Input-referred noise sets the detection floor. σ_amp = e_n.'
};

const jsonLd = generateCalculatorJsonLd(
  'Amplifier Noise',
  'Input-referred noise sets the detection floor. σ_amp = e_n.',
  'https://photonics-calculators.vercel.app/detectors/amplifier-noise',
  { category: 'Detectors' }
);

export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}
