import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/laser-safety/research-lab-safety' },
    title: 'Research Lab Laser Safety Calculator',
  description: 'Evaluate laser hazard zones, OD requirements, beam path analysis, and room coverage for research labs.'
};
const jsonLd = generateCalculatorJsonLd(
  `Research Lab Laser Safety Calculator',
  description: 'Evaluate laser hazard zones, OD requirements, beam path analysis, and room coverage for research labs.'
};


const jsonLd = generateCalculatorJsonLd(
  'Research Lab Laser Safety Calculator',
  'Evaluate laser hazard zones, OD requirements, beam path analysis, and room coverage for research labs.',
  'https://photonics-calculators.vercel.app/laser-safety/research-lab-safety',
  { category: 'Laser Safety`,
  `Evaluate laser hazard zones, OD requirements, beam path analysis, and room coverage for research labs.'
};


const jsonLd = generateCalculatorJsonLd(
  'Research Lab Laser Safety Calculator',
  'Evaluate laser hazard zones, OD requirements, beam path analysis, and room coverage for research labs.',
  'https://photonics-calculators.vercel.app/laser-safety/research-lab-safety',
  { category: 'Laser Safety`,
  `https://photonics-calculators.vercel.app/laser-safety/research-lab-safety`,
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
