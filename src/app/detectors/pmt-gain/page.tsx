import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/detectors/pmt-gain' },
    title: 'PMT Gain & SNR',
    description: 'PMT dynode gain, voltage dependence, anode responsivity, and SNR analysis.'
};

const jsonLd = generateCalculatorJsonLd(
  'PMT Gain & SNR',
  'PMT dynode gain, voltage dependence, anode responsivity, and SNR analysis.',
  'https://photonics-calculators.vercel.app/detectors/pmt-gain',
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
