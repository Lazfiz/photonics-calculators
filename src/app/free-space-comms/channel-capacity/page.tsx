import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/free-space-comms/channel-capacity' },
    title: 'Channel Capacity',
  description: 'Interactive Channel Capacity calculator for photonics and optical engineering.'
};
const jsonLd = generateCalculatorJsonLd(
  `Channel Capacity',
  description: 'Interactive Channel Capacity calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Channel Capacity',
  'Interactive Channel Capacity calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/free-space-comms/channel-capacity',
  { category: 'Free Space Comms`,
  `Interactive Channel Capacity calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Channel Capacity',
  'Interactive Channel Capacity calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/free-space-comms/channel-capacity',
  { category: 'Free Space Comms`,
  `https://photonics-calculators.vercel.app/free-space-comms/channel-capacity`,
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
