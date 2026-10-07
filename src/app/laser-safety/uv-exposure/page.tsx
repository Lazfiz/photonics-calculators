import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/laser-safety/uv-exposure' },
    title: 'UV Exposure Limits',
  description: 'Simplified educational estimate of actinic UV exposure limits with S(λ) weighting. Not for safety decisions; use IEC 62471.'
};

const jsonLd = generateCalculatorJsonLd(
  'UV Exposure Limits',
  'Simplified educational estimate of actinic UV exposure limits with S(λ) weighting. Not for safety decisions; use IEC 62471.',
  'https://photonics-calculators.vercel.app/laser-safety/uv-exposure',
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
