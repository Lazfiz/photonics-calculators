import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/wave-optics/parametric-amplification' },
    title: 'Parametric Amplification',
  description: 'Optical parametric amplification (OPA) gain and bandwidth in χ⁽²⁾ nonlinear crystals.'
};
const jsonLd = generateCalculatorJsonLd(
  `Parametric Amplification',
  description: 'Optical parametric amplification (OPA) gain and bandwidth in χ⁽²⁾ nonlinear crystals.'
};


const jsonLd = generateCalculatorJsonLd(
  'Parametric Amplification',
  'Optical parametric amplification (OPA) gain and bandwidth in χ⁽²⁾ nonlinear crystals.',
  'https://photonics-calculators.vercel.app/wave-optics/parametric-amplification',
  { category: 'Wave Optics`,
  `Optical parametric amplification (OPA) gain and bandwidth in χ⁽²⁾ nonlinear crystals.'
};


const jsonLd = generateCalculatorJsonLd(
  'Parametric Amplification',
  'Optical parametric amplification (OPA) gain and bandwidth in χ⁽²⁾ nonlinear crystals.',
  'https://photonics-calculators.vercel.app/wave-optics/parametric-amplification',
  { category: 'Wave Optics`,
  `https://photonics-calculators.vercel.app/wave-optics/parametric-amplification`,
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
