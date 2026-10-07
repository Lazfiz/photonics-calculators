import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/free-space-comms/lasercom-link' },
    title: 'Lasercom Link Budget',
  description: 'Lasercom link budget with Gaussian-beam transmit and receive gains, free-space path loss, spot size at the receiver, and pointing and atmospheric losses.'
};

const jsonLd = generateCalculatorJsonLd(
  'Lasercom Link Budget',
  'Lasercom link budget with Gaussian-beam transmit and receive gains, free-space path loss, spot size at the receiver, and pointing and atmospheric losses.',
  'https://photonics-calculators.vercel.app/free-space-comms/lasercom-link',
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
