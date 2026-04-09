import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/free-space-comms/background-noise' },
    title: 'Background Noise',
  description: 'Interactive Background Noise calculator for photonics and optical engineering.'
};
const jsonLd = generateCalculatorJsonLd(
  `Background Noise',
  description: 'Interactive Background Noise calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Background Noise',
  'Interactive Background Noise calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/free-space-comms/background-noise',
  { category: 'Free Space Comms`,
  `Interactive Background Noise calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Background Noise',
  'Interactive Background Noise calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/free-space-comms/background-noise',
  { category: 'Free Space Comms`,
  `https://photonics-calculators.vercel.app/free-space-comms/background-noise`,
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
