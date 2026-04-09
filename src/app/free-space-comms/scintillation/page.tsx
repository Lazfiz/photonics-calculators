import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/free-space-comms/scintillation' },
    title: 'Scintillation Index',
  description: 'Rytov variance, aperture averaging, and fade probability for atmospheric turbulence.'
};
const jsonLd = generateCalculatorJsonLd(
  `Scintillation Index',
  description: 'Rytov variance, aperture averaging, and fade probability for atmospheric turbulence.'
};


const jsonLd = generateCalculatorJsonLd(
  'Scintillation Index',
  'Rytov variance, aperture averaging, and fade probability for atmospheric turbulence.',
  'https://photonics-calculators.vercel.app/free-space-comms/scintillation',
  { category: 'Free Space Comms`,
  `Rytov variance, aperture averaging, and fade probability for atmospheric turbulence.'
};


const jsonLd = generateCalculatorJsonLd(
  'Scintillation Index',
  'Rytov variance, aperture averaging, and fade probability for atmospheric turbulence.',
  'https://photonics-calculators.vercel.app/free-space-comms/scintillation',
  { category: 'Free Space Comms`,
  `https://photonics-calculators.vercel.app/free-space-comms/scintillation`,
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
