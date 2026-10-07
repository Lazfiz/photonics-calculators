import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/free-space-comms/aperture-averaging' },
    title: 'Aperture Averaging',
  description: 'Aperture-averaging factor for plane and spherical waves, Rytov variance and the reduced scintillation index versus receiver diameter over √(λL).'
};

const jsonLd = generateCalculatorJsonLd(
  'Aperture Averaging',
  'Aperture-averaging factor for plane and spherical waves, Rytov variance and the reduced scintillation index versus receiver diameter over √(λL).',
  'https://photonics-calculators.vercel.app/free-space-comms/aperture-averaging',
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
