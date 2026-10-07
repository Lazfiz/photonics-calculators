import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/free-space-comms/adaptive-optics' },
    title: 'Adaptive Optics for FSO',
  description: 'Fried parameter r₀, Greenwood frequency, isoplanatic angle and Strehl ratio with and without adaptive optics for a free-space optical link.'
};

const jsonLd = generateCalculatorJsonLd(
  'Adaptive Optics for FSO',
  'Fried parameter r₀, Greenwood frequency, isoplanatic angle and Strehl ratio with and without adaptive optics for a free-space optical link.',
  'https://photonics-calculators.vercel.app/free-space-comms/adaptive-optics',
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
