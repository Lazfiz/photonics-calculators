import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/wave-optics/dye-laser-resonator' },
    title: 'Dye Laser Resonator',
  description: 'Cavity stability, beam waist, small-signal and threshold gain, triplet loss versus flow speed and output power of a Rhodamine or Coumarin dye laser.'
};

const jsonLd = generateCalculatorJsonLd(
  'Dye Laser Resonator',
  'Cavity stability, beam waist, small-signal and threshold gain, triplet loss versus flow speed and output power of a Rhodamine or Coumarin dye laser.',
  'https://photonics-calculators.vercel.app/wave-optics/dye-laser-resonator',
  { category: 'Wave Optics' }
);

export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}
