import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/wave-optics/self-phase-modulation' },
    title: 'Self-Phase Modulation (SPM)',
  description: 'Intensity-dependent phase shift and spectral broadening from the optical Kerr effect.'
};
const jsonLd = generateCalculatorJsonLd(
  `Self-Phase Modulation (SPM)',
  description: 'Intensity-dependent phase shift and spectral broadening from the optical Kerr effect.'
};


const jsonLd = generateCalculatorJsonLd(
  'Self-Phase Modulation (SPM)',
  'Intensity-dependent phase shift and spectral broadening from the optical Kerr effect.',
  'https://photonics-calculators.vercel.app/wave-optics/self-phase-modulation',
  { category: 'Wave Optics`,
  `Intensity-dependent phase shift and spectral broadening from the optical Kerr effect.'
};


const jsonLd = generateCalculatorJsonLd(
  'Self-Phase Modulation (SPM)',
  'Intensity-dependent phase shift and spectral broadening from the optical Kerr effect.',
  'https://photonics-calculators.vercel.app/wave-optics/self-phase-modulation',
  { category: 'Wave Optics`,
  `https://photonics-calculators.vercel.app/wave-optics/self-phase-modulation`,
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
