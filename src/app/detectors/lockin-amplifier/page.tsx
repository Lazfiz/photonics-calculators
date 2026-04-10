import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/detectors/lockin-amplifier' },
    title: 'Lock-in Amplifier',
    description: 'Lock-in amplifier: demodulation gain, ENBW, noise rejection, and SNR improvement.'
};

const jsonLd = generateCalculatorJsonLd(
  'Lock-in Amplifier',
  'Lock-in amplifier: demodulation gain, ENBW, noise rejection, and SNR improvement.',
  'https://photonics-calculators.vercel.app/detectors/lockin-amplifier',
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
