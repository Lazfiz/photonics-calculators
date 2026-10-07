import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/free-space-comms/acquisition-tracking' },
    title: 'FSO Acquisition and Tracking',
  description: 'Acquisition probability, scan lines and scan time over the uncertainty cone, beacon SNR and margin, and tracking jitter for a free-space optical terminal.'
};

const jsonLd = generateCalculatorJsonLd(
  'FSO Acquisition and Tracking',
  'Acquisition probability, scan lines and scan time over the uncertainty cone, beacon SNR and margin, and tracking jitter for a free-space optical terminal.',
  'https://photonics-calculators.vercel.app/free-space-comms/acquisition-tracking',
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
