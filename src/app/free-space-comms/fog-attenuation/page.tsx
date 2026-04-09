import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/free-space-comms/fog-attenuation' },
    title: 'Fog Attenuation',
  description: 'Interactive Fog Attenuation calculator for photonics and optical engineering.'
};
const jsonLd = generateCalculatorJsonLd(
  `Fog Attenuation',
  description: 'Interactive Fog Attenuation calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Fog Attenuation',
  'Interactive Fog Attenuation calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/free-space-comms/fog-attenuation',
  { category: 'Free Space Comms`,
  `Interactive Fog Attenuation calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Fog Attenuation',
  'Interactive Fog Attenuation calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/free-space-comms/fog-attenuation',
  { category: 'Free Space Comms`,
  `https://photonics-calculators.vercel.app/free-space-comms/fog-attenuation`,
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
