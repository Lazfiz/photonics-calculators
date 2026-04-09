import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/imaging/expansion-microscopy' },
    title: 'Expansion Microscopy Calculator',
  description: 'ExM effective resolution, probe size reduction, and expansion trade-offs.'
};
const jsonLd = generateCalculatorJsonLd(
  `Expansion Microscopy Calculator',
  description: 'ExM effective resolution, probe size reduction, and expansion trade-offs.'
};


const jsonLd = generateCalculatorJsonLd(
  'Expansion Microscopy Calculator',
  'ExM effective resolution, probe size reduction, and expansion trade-offs.',
  'https://photonics-calculators.vercel.app/imaging/expansion-microscopy',
  { category: 'Imaging`,
  `ExM effective resolution, probe size reduction, and expansion trade-offs.'
};


const jsonLd = generateCalculatorJsonLd(
  'Expansion Microscopy Calculator',
  'ExM effective resolution, probe size reduction, and expansion trade-offs.',
  'https://photonics-calculators.vercel.app/imaging/expansion-microscopy',
  { category: 'Imaging`,
  `https://photonics-calculators.vercel.app/imaging/expansion-microscopy`,
  { category: `Imaging` }
);
export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}
