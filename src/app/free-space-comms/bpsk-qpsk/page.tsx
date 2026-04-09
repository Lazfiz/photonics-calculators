import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/free-space-comms/bpsk-qpsk' },
    title: 'Bpsk Qpsk',
  description: 'Interactive Bpsk Qpsk calculator for photonics and optical engineering.'
};
const jsonLd = generateCalculatorJsonLd(
  `Bpsk Qpsk',
  description: 'Interactive Bpsk Qpsk calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Bpsk Qpsk',
  'Interactive Bpsk Qpsk calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/free-space-comms/bpsk-qpsk',
  { category: 'Free Space Comms`,
  `Interactive Bpsk Qpsk calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Bpsk Qpsk',
  'Interactive Bpsk Qpsk calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/free-space-comms/bpsk-qpsk',
  { category: 'Free Space Comms`,
  `https://photonics-calculators.vercel.app/free-space-comms/bpsk-qpsk`,
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
