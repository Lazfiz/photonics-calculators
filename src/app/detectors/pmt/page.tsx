import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/detectors/pmt' },
    title: 'Photomultiplier Tube (PMT)',
    description: 'PMT gain, signal current, excess noise factor, and SNR from dynode parameters.'
};

const jsonLd = generateCalculatorJsonLd(
  'Photomultiplier Tube (PMT)',
  'PMT gain, signal current, excess noise factor, and SNR from dynode parameters.',
  'https://photonics-calculators.vercel.app/detectors/pmt',
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
