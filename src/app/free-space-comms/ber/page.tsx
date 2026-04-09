import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/free-space-comms/ber' },
    title: 'Ber',
  description: 'Interactive Ber calculator for photonics and optical engineering.'
};
const jsonLd = generateCalculatorJsonLd(
  `Ber',
  description: 'Interactive Ber calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Ber',
  'Interactive Ber calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/free-space-comms/ber',
  { category: 'Free Space Comms`,
  `Interactive Ber calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Ber',
  'Interactive Ber calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/free-space-comms/ber',
  { category: 'Free Space Comms`,
  `https://photonics-calculators.vercel.app/free-space-comms/ber`,
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
