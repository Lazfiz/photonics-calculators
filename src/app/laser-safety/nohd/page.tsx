import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/laser-safety/nohd' },
    title: 'Nominal Ocular Hazard Distance (NOHD)',
    description: 'Bounded CW point-source NOHD pre-check for educational use only. Based on ANSI Z136.1 direct-beam ocular MPE calculations.'
};

const jsonLd = generateCalculatorJsonLd(
  'Nominal Ocular Hazard Distance (NOHD)',
  'Bounded CW point-source NOHD pre-check for educational use only. Based on ANSI Z136.1 direct-beam ocular MPE calculations.',
  'https://photonics-calculators.vercel.app/laser-safety/nohd',
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
