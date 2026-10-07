import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/laser-safety/scanned-mpe' },
    title: 'Scanned Beam MPE',
  description: 'Simplified educational estimate of dwell time, pulses per point and scanned-beam MPE versus scan frequency. Not for safety decisions; use ANSI Z136.1.'
};

const jsonLd = generateCalculatorJsonLd(
  'Scanned Beam MPE',
  'Simplified educational estimate of dwell time, pulses per point and scanned-beam MPE versus scan frequency. Not for safety decisions; use ANSI Z136.1.',
  'https://photonics-calculators.vercel.app/laser-safety/scanned-mpe',
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
