import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/polarization/brewster-polarizer' },
    title: 'Brewster-Angle Polarizer',
  description: "Design Brewster-angle polarizers using tilted glass plates. At Brewster's angle, p-polarized light has zero reflection."
};

const jsonLd = generateCalculatorJsonLd(
  'Brewster-Angle Polarizer',
  "Design Brewster-angle polarizers using tilted glass plates. At Brewster's angle, p-polarized light has zero reflection.",
  'https://photonics-calculators.vercel.app/polarization/brewster-polarizer',
  { category: 'Polarization' }
);

export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}
