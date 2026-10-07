import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/free-space-comms/background-noise' },
    title: 'FSO Background Noise',
  description: 'Background power, photon rate and electrons per bit from day sky, night sky, direct sun or urban glow for a given receiver FOV, aperture and filter.'
};

const jsonLd = generateCalculatorJsonLd(
  'FSO Background Noise',
  'Background power, photon rate and electrons per bit from day sky, night sky, direct sun or urban glow for a given receiver FOV, aperture and filter.',
  'https://photonics-calculators.vercel.app/free-space-comms/background-noise',
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
