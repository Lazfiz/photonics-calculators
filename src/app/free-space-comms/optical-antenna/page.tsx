import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/free-space-comms/optical-antenna' },
    title: 'Optical Antenna',
  description: 'Interactive Optical Antenna calculator for photonics and optical engineering.'
};
const jsonLd = generateCalculatorJsonLd(
  `Optical Antenna',
  description: 'Interactive Optical Antenna calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Optical Antenna',
  'Interactive Optical Antenna calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/free-space-comms/optical-antenna',
  { category: 'Free Space Comms`,
  `Interactive Optical Antenna calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Optical Antenna',
  'Interactive Optical Antenna calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/free-space-comms/optical-antenna',
  { category: 'Free Space Comms`,
  `https://photonics-calculators.vercel.app/free-space-comms/optical-antenna`,
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
