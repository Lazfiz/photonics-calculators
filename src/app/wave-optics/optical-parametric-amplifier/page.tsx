import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/wave-optics/optical-parametric-amplifier' },
    title: 'Optical Parametric Amplifier',
  description: 'Interactive Optical Parametric Amplifier calculator for photonics and optical engineering.'
};
const jsonLd = generateCalculatorJsonLd(
  `Optical Parametric Amplifier',
  description: 'Interactive Optical Parametric Amplifier calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Optical Parametric Amplifier',
  'Interactive Optical Parametric Amplifier calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/wave-optics/optical-parametric-amplifier',
  { category: 'Wave Optics`,
  `Interactive Optical Parametric Amplifier calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Optical Parametric Amplifier',
  'Interactive Optical Parametric Amplifier calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/wave-optics/optical-parametric-amplifier',
  { category: 'Wave Optics`,
  `https://photonics-calculators.vercel.app/wave-optics/optical-parametric-amplifier`,
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
