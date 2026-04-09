import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/laser-safety/diode-laser-safety' },
    title: 'Diode Laser Safety Calculator',
  description: 'Calculate MPE, NOHD, and OD requirements for diode laser bars/stacks with asymmetric divergence.'
};
const jsonLd = generateCalculatorJsonLd(
  `Diode Laser Safety Calculator',
  description: 'Calculate MPE, NOHD, and OD requirements for diode laser bars/stacks with asymmetric divergence.'
};


const jsonLd = generateCalculatorJsonLd(
  'Diode Laser Safety Calculator',
  'Calculate MPE, NOHD, and OD requirements for diode laser bars/stacks with asymmetric divergence.',
  'https://photonics-calculators.vercel.app/laser-safety/diode-laser-safety',
  { category: 'Laser Safety`,
  `Calculate MPE, NOHD, and OD requirements for diode laser bars/stacks with asymmetric divergence.'
};


const jsonLd = generateCalculatorJsonLd(
  'Diode Laser Safety Calculator',
  'Calculate MPE, NOHD, and OD requirements for diode laser bars/stacks with asymmetric divergence.',
  'https://photonics-calculators.vercel.app/laser-safety/diode-laser-safety',
  { category: 'Laser Safety`,
  `https://photonics-calculators.vercel.app/laser-safety/diode-laser-safety`,
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
