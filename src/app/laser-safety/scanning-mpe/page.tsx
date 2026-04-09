import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/laser-safety/scanning-mpe' },
    title: 'Scanned Beam MPE',
  description: 'Calculates the effective MPE for scanning laser beams where dwell time per retinal point is reduced compared to stationary exposure.'
};
const jsonLd = generateCalculatorJsonLd(
  `Scanned Beam MPE',
  description: 'Calculates the effective MPE for scanning laser beams where dwell time per retinal point is reduced compared to stationary exposure.'
};


const jsonLd = generateCalculatorJsonLd(
  'Scanned Beam MPE',
  'Calculates the effective MPE for scanning laser beams where dwell time per retinal point is reduced compared to stationary exposure.',
  'https://photonics-calculators.vercel.app/laser-safety/scanning-mpe',
  { category: 'Laser Safety`,
  `Calculates the effective MPE for scanning laser beams where dwell time per retinal point is reduced compared to stationary exposure.'
};


const jsonLd = generateCalculatorJsonLd(
  'Scanned Beam MPE',
  'Calculates the effective MPE for scanning laser beams where dwell time per retinal point is reduced compared to stationary exposure.',
  'https://photonics-calculators.vercel.app/laser-safety/scanning-mpe',
  { category: 'Laser Safety`,
  `https://photonics-calculators.vercel.app/laser-safety/scanning-mpe`,
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
