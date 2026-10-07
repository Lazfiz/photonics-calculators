import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/free-space-comms/security' },
    title: 'FSO Physical-Layer Security',
  description: 'Power at the receiver and an off-axis eavesdropper, Bob/Eve ratio, secrecy capacity and a BB84 key-rate estimate for a free-space optical link.'
};

const jsonLd = generateCalculatorJsonLd(
  'FSO Physical-Layer Security',
  'Power at the receiver and an off-axis eavesdropper, Bob/Eve ratio, secrecy capacity and a BB84 key-rate estimate for a free-space optical link.',
  'https://photonics-calculators.vercel.app/free-space-comms/security',
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
