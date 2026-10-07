import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/free-space-comms/eye-safety-fso' },
    title: 'FSO Eye Safety',
  description: 'Simplified educational estimate of MPE, NOHD, laser class and safety factor for an FSO transmitter. Not for safety decisions; use IEC 60825-1.'
};

const jsonLd = generateCalculatorJsonLd(
  'FSO Eye Safety',
  'Simplified educational estimate of MPE, NOHD, laser class and safety factor for an FSO transmitter. Not for safety decisions; use IEC 60825-1.',
  'https://photonics-calculators.vercel.app/free-space-comms/eye-safety-fso',
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
