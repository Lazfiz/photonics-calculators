import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/free-space-comms/rain-attenuation' },
    title: 'Rain Attenuation',
  description: 'Interactive Rain Attenuation calculator for photonics and optical engineering.'
};
const jsonLd = generateCalculatorJsonLd(
  `Rain Attenuation',
  description: 'Interactive Rain Attenuation calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Rain Attenuation',
  'Interactive Rain Attenuation calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/free-space-comms/rain-attenuation',
  { category: 'Free Space Comms`,
  `Interactive Rain Attenuation calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Rain Attenuation',
  'Interactive Rain Attenuation calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/free-space-comms/rain-attenuation',
  { category: 'Free Space Comms`,
  `https://photonics-calculators.vercel.app/free-space-comms/rain-attenuation`,
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
