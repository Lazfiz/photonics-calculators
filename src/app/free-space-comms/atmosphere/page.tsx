import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/free-space-comms/atmosphere' },
    title: 'Atmospheric Transmission',
  description: 'Molecular and aerosol extinction for free-space optical links.'
};
const jsonLd = generateCalculatorJsonLd(
  `Atmospheric Transmission',
  description: 'Molecular and aerosol extinction for free-space optical links.'
};


const jsonLd = generateCalculatorJsonLd(
  'Atmospheric Transmission',
  'Molecular and aerosol extinction for free-space optical links.',
  'https://photonics-calculators.vercel.app/free-space-comms/atmosphere',
  { category: 'Free Space Comms`,
  `Molecular and aerosol extinction for free-space optical links.'
};


const jsonLd = generateCalculatorJsonLd(
  'Atmospheric Transmission',
  'Molecular and aerosol extinction for free-space optical links.',
  'https://photonics-calculators.vercel.app/free-space-comms/atmosphere',
  { category: 'Free Space Comms`,
  `https://photonics-calculators.vercel.app/free-space-comms/atmosphere`,
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
