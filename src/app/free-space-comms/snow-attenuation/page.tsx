import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/free-space-comms/snow-attenuation' },
    title: 'Snow Attenuation',
  description: 'Interactive Snow Attenuation calculator for photonics and optical engineering.'
};
const jsonLd = generateCalculatorJsonLd(
  `Snow Attenuation',
  description: 'Interactive Snow Attenuation calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Snow Attenuation',
  'Interactive Snow Attenuation calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/free-space-comms/snow-attenuation',
  { category: 'Free Space Comms`,
  `Interactive Snow Attenuation calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Snow Attenuation',
  'Interactive Snow Attenuation calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/free-space-comms/snow-attenuation',
  { category: 'Free Space Comms`,
  `https://photonics-calculators.vercel.app/free-space-comms/snow-attenuation`,
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
