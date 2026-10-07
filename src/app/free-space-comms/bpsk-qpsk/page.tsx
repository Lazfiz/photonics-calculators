import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/free-space-comms/bpsk-qpsk' },
    title: 'BPSK and QPSK Error Rates',
  description: 'Bit and symbol error rates of BPSK, Gray-coded QPSK and OQPSK versus Eb/N0, with spectral efficiency, bandwidth, required receive power and margin.'
};

const jsonLd = generateCalculatorJsonLd(
  'BPSK and QPSK Error Rates',
  'Bit and symbol error rates of BPSK, Gray-coded QPSK and OQPSK versus Eb/N0, with spectral efficiency, bandwidth, required receive power and margin.',
  'https://photonics-calculators.vercel.app/free-space-comms/bpsk-qpsk',
  { category: 'Free Space Comms' }
);

export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}
