import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/polarization/polarizer-types' },
    title: 'Polarizer Types Comparison',
  description: 'Compare extinction ratio, transmission, damage threshold, and other specs across common polarizer types.'
};
const jsonLd = generateCalculatorJsonLd(
  `Polarizer Types Comparison',
  description: 'Compare extinction ratio, transmission, damage threshold, and other specs across common polarizer types.'
};


const jsonLd = generateCalculatorJsonLd(
  'Polarizer Types Comparison',
  'Compare extinction ratio, transmission, damage threshold, and other specs across common polarizer types.',
  'https://photonics-calculators.vercel.app/polarization/polarizer-types',
  { category: 'Polarization`,
  `Compare extinction ratio, transmission, damage threshold, and other specs across common polarizer types.'
};


const jsonLd = generateCalculatorJsonLd(
  'Polarizer Types Comparison',
  'Compare extinction ratio, transmission, damage threshold, and other specs across common polarizer types.',
  'https://photonics-calculators.vercel.app/polarization/polarizer-types',
  { category: 'Polarization`,
  `https://photonics-calculators.vercel.app/polarization/polarizer-types`,
  { category: `Polarization` }
);
export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}
