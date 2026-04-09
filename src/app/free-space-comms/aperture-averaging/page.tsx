import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/free-space-comms/aperture-averaging' },
    title: 'Aperture Averaging',
  description: 'Interactive Aperture Averaging calculator for photonics and optical engineering.'
};
const jsonLd = generateCalculatorJsonLd(
  `Aperture Averaging',
  description: 'Interactive Aperture Averaging calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Aperture Averaging',
  'Interactive Aperture Averaging calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/free-space-comms/aperture-averaging',
  { category: 'Free Space Comms`,
  `Interactive Aperture Averaging calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Aperture Averaging',
  'Interactive Aperture Averaging calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/free-space-comms/aperture-averaging',
  { category: 'Free Space Comms`,
  `https://photonics-calculators.vercel.app/free-space-comms/aperture-averaging`,
  { category: `Free Space Comms` }
);
export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}
