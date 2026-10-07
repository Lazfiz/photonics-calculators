import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/free-space-comms/ber' },
    title: 'Photon-Counting BER (OOK and DPSK)',
  description: 'Exact Poisson bit error rate of photon-counting OOK and DPSK receivers versus detected photons per bit and dark plus background counts.'
};

const jsonLd = generateCalculatorJsonLd(
  'Photon-Counting BER (OOK and DPSK)',
  'Exact Poisson bit error rate of photon-counting OOK and DPSK receivers versus detected photons per bit and dark plus background counts.',
  'https://photonics-calculators.vercel.app/free-space-comms/ber',
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
