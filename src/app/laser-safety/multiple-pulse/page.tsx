import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/laser-safety/multiple-pulse' },
    title: 'Multiple Pulse Correction',
  description: 'Evaluates all three ANSI Z136.1 rules for repetitive pulse exposure and selects the most restrictive MPE.'
};
const jsonLd = generateCalculatorJsonLd(
  `Multiple Pulse Correction',
  description: 'Evaluates all three ANSI Z136.1 rules for repetitive pulse exposure and selects the most restrictive MPE.'
};


const jsonLd = generateCalculatorJsonLd(
  'Multiple Pulse Correction',
  'Evaluates all three ANSI Z136.1 rules for repetitive pulse exposure and selects the most restrictive MPE.',
  'https://photonics-calculators.vercel.app/laser-safety/multiple-pulse',
  { category: 'Laser Safety`,
  `Evaluates all three ANSI Z136.1 rules for repetitive pulse exposure and selects the most restrictive MPE.'
};


const jsonLd = generateCalculatorJsonLd(
  'Multiple Pulse Correction',
  'Evaluates all three ANSI Z136.1 rules for repetitive pulse exposure and selects the most restrictive MPE.',
  'https://photonics-calculators.vercel.app/laser-safety/multiple-pulse',
  { category: 'Laser Safety`,
  `https://photonics-calculators.vercel.app/laser-safety/multiple-pulse`,
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
