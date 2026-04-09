import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/imaging/structured-illumination' },
    title: 'Structured Illumination Microscopy',
  description: 'SIM resolution enhancement and OTF expansion via patterned illumination.'
};
const jsonLd = generateCalculatorJsonLd(
  `Structured Illumination Microscopy',
  description: 'SIM resolution enhancement and OTF expansion via patterned illumination.'
};


const jsonLd = generateCalculatorJsonLd(
  'Structured Illumination Microscopy',
  'SIM resolution enhancement and OTF expansion via patterned illumination.',
  'https://photonics-calculators.vercel.app/imaging/structured-illumination',
  { category: 'Imaging`,
  `SIM resolution enhancement and OTF expansion via patterned illumination.'
};


const jsonLd = generateCalculatorJsonLd(
  'Structured Illumination Microscopy',
  'SIM resolution enhancement and OTF expansion via patterned illumination.',
  'https://photonics-calculators.vercel.app/imaging/structured-illumination',
  { category: 'Imaging`,
  `https://photonics-calculators.vercel.app/imaging/structured-illumination`,
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
