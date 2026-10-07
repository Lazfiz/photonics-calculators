import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/free-space-comms/quantum-key-distribution' },
    title: 'QKD Secure Key Rate',
  description: 'Decoy-state BB84 secure key rate, QBER, single-photon yield and maximum range versus channel loss, detector efficiency, dark counts and pulse rate.'
};

const jsonLd = generateCalculatorJsonLd(
  'QKD Secure Key Rate',
  'Decoy-state BB84 secure key rate, QBER, single-photon yield and maximum range versus channel loss, detector efficiency, dark counts and pulse rate.',
  'https://photonics-calculators.vercel.app/free-space-comms/quantum-key-distribution',
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
