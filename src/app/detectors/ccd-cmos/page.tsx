import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/detectors/ccd-cmos' },
    title: 'CCD vs CMOS Comparison',
    description: 'Compare SNR and dynamic range between CCD and CMOS detectors.'
};

const jsonLd = generateCalculatorJsonLd(
  'CCD vs CMOS Comparison',
  'Compare SNR and dynamic range between CCD and CMOS detectors.',
  'https://photonics-calculators.vercel.app/detectors/ccd-cmos',
  { category: 'Detectors' }
);

export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}
