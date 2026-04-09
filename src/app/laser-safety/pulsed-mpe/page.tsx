import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/laser-safety/pulsed-mpe' },
      title: 'Pulsed Laser MPE',
  description: 'Repetitive pulse MPE with N⁻⁰²⁵ correction factor. Simplified ANSI Z136 model.',
};
const jsonLd = generateCalculatorJsonLd(
  `Pulsed Laser MPE',
  description: 'Repetitive pulse MPE with N⁻⁰²⁵ correction factor. Simplified ANSI Z136 model.',
};


const jsonLd = generateCalculatorJsonLd(
  'Pulsed Laser MPE',
  'Repetitive pulse MPE with N⁻⁰²⁵ correction factor. Simplified ANSI Z136 model.',
  'https://photonics-calculators.vercel.app/laser-safety/pulsed-mpe',
  { category: 'Laser Safety`,
  `Repetitive pulse MPE with N⁻⁰²⁵ correction factor. Simplified ANSI Z136 model.',
};


const jsonLd = generateCalculatorJsonLd(
  'Pulsed Laser MPE',
  'Repetitive pulse MPE with N⁻⁰²⁵ correction factor. Simplified ANSI Z136 model.',
  'https://photonics-calculators.vercel.app/laser-safety/pulsed-mpe',
  { category: 'Laser Safety`,
  `https://photonics-calculators.vercel.app/laser-safety/pulsed-mpe`,
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
