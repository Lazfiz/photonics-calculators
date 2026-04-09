import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/laser-safety/viewing-distance' },
    title: 'Safe Viewing Distance (CW point-source pre-check)',
  description: 'Bounded CW point-source direct-beam viewing-distance pre-check using the same assumptions as the MPE and NOHD pages.'
};
const jsonLd = generateCalculatorJsonLd(
  `Safe Viewing Distance (CW point-source pre-check)',
  description: 'Bounded CW point-source direct-beam viewing-distance pre-check using the same assumptions as the MPE and NOHD pages.'
};


const jsonLd = generateCalculatorJsonLd(
  'Safe Viewing Distance (CW point-source pre-check)',
  'Bounded CW point-source direct-beam viewing-distance pre-check using the same assumptions as the MPE and NOHD pages.',
  'https://photonics-calculators.vercel.app/laser-safety/viewing-distance',
  { category: 'Laser Safety`,
  `Bounded CW point-source direct-beam viewing-distance pre-check using the same assumptions as the MPE and NOHD pages.'
};


const jsonLd = generateCalculatorJsonLd(
  'Safe Viewing Distance (CW point-source pre-check)',
  'Bounded CW point-source direct-beam viewing-distance pre-check using the same assumptions as the MPE and NOHD pages.',
  'https://photonics-calculators.vercel.app/laser-safety/viewing-distance',
  { category: 'Laser Safety`,
  `https://photonics-calculators.vercel.app/laser-safety/viewing-distance`,
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
