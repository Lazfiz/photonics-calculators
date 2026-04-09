import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/wave-optics/bessel-beam' },
    title: 'Bessel Beam Calculator',
  description: 'Non-diffracting beam profiles and propagation.'
};
const jsonLd = generateCalculatorJsonLd(
  `Bessel Beam Calculator',
  description: 'Non-diffracting beam profiles and propagation.'
};


const jsonLd = generateCalculatorJsonLd(
  'Bessel Beam Calculator',
  'Non-diffracting beam profiles and propagation.',
  'https://photonics-calculators.vercel.app/wave-optics/bessel-beam',
  { category: 'Wave Optics`,
  `Non-diffracting beam profiles and propagation.'
};


const jsonLd = generateCalculatorJsonLd(
  'Bessel Beam Calculator',
  'Non-diffracting beam profiles and propagation.',
  'https://photonics-calculators.vercel.app/wave-optics/bessel-beam',
  { category: 'Wave Optics`,
  `https://photonics-calculators.vercel.app/wave-optics/bessel-beam`,
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
