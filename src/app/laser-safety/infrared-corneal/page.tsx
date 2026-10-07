import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/laser-safety/infrared-corneal' },
    title: 'IR Corneal Exposure',
  description: 'Simplified educational estimate of the infrared corneal MPE and maximum safe power. Not for safety decisions; use ANSI Z136.1 or IEC 60825-1.'
};

const jsonLd = generateCalculatorJsonLd(
  'IR Corneal Exposure',
  'Simplified educational estimate of the infrared corneal MPE and maximum safe power. Not for safety decisions; use ANSI Z136.1 or IEC 60825-1.',
  'https://photonics-calculators.vercel.app/laser-safety/infrared-corneal',
  { category: 'Laser Safety' }
);

export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}
