import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/detectors/channel-photomultiplier' },
    title: 'Channel Photomultiplier (Multi-Channel PMT)',
    description: 'Multi-channel PMT: gain staging, energy resolution, and timing.'
};

const jsonLd = generateCalculatorJsonLd(
  'Channel Photomultiplier (Multi-Channel PMT)',
  'Multi-channel PMT: gain staging, energy resolution, and timing.',
  'https://photonics-calculators.vercel.app/detectors/channel-photomultiplier',
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
