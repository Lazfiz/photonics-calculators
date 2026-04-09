import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/laser-safety/nohd' },
    title: 'Nominal Ocular Hazard Distance (NOHD)',
  description: 'Bounded CW point-source NOHD pre-check derived from the same direct-beam ocular MPE branch as the MPE page.'
};
const jsonLd = generateCalculatorJsonLd(
  `Nominal Ocular Hazard Distance (NOHD)',
  description: 'Bounded CW point-source NOHD pre-check derived from the same direct-beam ocular MPE branch as the MPE page.'
};


const jsonLd = generateCalculatorJsonLd(
  'Nominal Ocular Hazard Distance (NOHD)',
  'Bounded CW point-source NOHD pre-check derived from the same direct-beam ocular MPE branch as the MPE page.',
  'https://photonics-calculators.vercel.app/laser-safety/nohd',
  { category: 'Laser Safety`,
  `Bounded CW point-source NOHD pre-check derived from the same direct-beam ocular MPE branch as the MPE page.'
};


const jsonLd = generateCalculatorJsonLd(
  'Nominal Ocular Hazard Distance (NOHD)',
  'Bounded CW point-source NOHD pre-check derived from the same direct-beam ocular MPE branch as the MPE page.',
  'https://photonics-calculators.vercel.app/laser-safety/nohd',
  { category: 'Laser Safety`,
  `https://photonics-calculators.vercel.app/laser-safety/nohd`,
  { category: `Laser Safety` }
);
export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}
