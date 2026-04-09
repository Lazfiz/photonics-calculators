import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/laser-safety/prf-correction' },
    title: 'PRF Correction Factor',
  description: 'Calculates the repetitive-pulse correction factor Cp for pulsed laser MPE per ANSI Z136.1 §8.'
};
const jsonLd = generateCalculatorJsonLd(
  `PRF Correction Factor',
  description: 'Calculates the repetitive-pulse correction factor Cp for pulsed laser MPE per ANSI Z136.1 §8.'
};


const jsonLd = generateCalculatorJsonLd(
  'PRF Correction Factor',
  'Calculates the repetitive-pulse correction factor Cp for pulsed laser MPE per ANSI Z136.1 §8.',
  'https://photonics-calculators.vercel.app/laser-safety/prf-correction',
  { category: 'Laser Safety`,
  `Calculates the repetitive-pulse correction factor Cp for pulsed laser MPE per ANSI Z136.1 §8.'
};


const jsonLd = generateCalculatorJsonLd(
  'PRF Correction Factor',
  'Calculates the repetitive-pulse correction factor Cp for pulsed laser MPE per ANSI Z136.1 §8.',
  'https://photonics-calculators.vercel.app/laser-safety/prf-correction',
  { category: 'Laser Safety`,
  `https://photonics-calculators.vercel.app/laser-safety/prf-correction`,
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
