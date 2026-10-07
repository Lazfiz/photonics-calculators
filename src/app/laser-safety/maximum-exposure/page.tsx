import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/laser-safety/maximum-exposure' },
    title: 'Maximum Exposure Duration',
  description: 'Simplified educational estimate of the longest exposure before the MPE is reached. Not for safety decisions; use ANSI Z136.1.'
};

const jsonLd = generateCalculatorJsonLd(
  'Maximum Exposure Duration',
  'Simplified educational estimate of the longest exposure before the MPE is reached. Not for safety decisions; use ANSI Z136.1.',
  'https://photonics-calculators.vercel.app/laser-safety/maximum-exposure',
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
