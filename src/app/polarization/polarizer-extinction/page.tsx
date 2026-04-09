import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/polarization/polarizer-extinction' },
    title: 'Polarizer Extinction Ratio',
  description: "Analyze extinction ratio, Malus's law with imperfect polarizers, and cascaded extinction performance."
};

const jsonLd = generateCalculatorJsonLd(
  'Polarizer Extinction Ratio',
  "Analyze extinction ratio, Malus's law with imperfect polarizers, and cascaded extinction performance.",
  'https://photonics-calculators.vercel.app/polarization/polarizer-extinction',
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
