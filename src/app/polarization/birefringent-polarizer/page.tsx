import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/polarization/birefringent-polarizer' },
    title: 'Birefringent Polarizer Design',
  description: 'Compare Glan, Wollaston, Rochon, and Senarmont polarizer designs using birefringent crystal prisms.'
};
const jsonLd = generateCalculatorJsonLd(
  `Birefringent Polarizer Design',
  description: 'Compare Glan, Wollaston, Rochon, and Senarmont polarizer designs using birefringent crystal prisms.'
};


const jsonLd = generateCalculatorJsonLd(
  'Birefringent Polarizer Design',
  'Compare Glan, Wollaston, Rochon, and Senarmont polarizer designs using birefringent crystal prisms.',
  'https://photonics-calculators.vercel.app/polarization/birefringent-polarizer',
  { category: 'Polarization`,
  `Compare Glan, Wollaston, Rochon, and Senarmont polarizer designs using birefringent crystal prisms.'
};


const jsonLd = generateCalculatorJsonLd(
  'Birefringent Polarizer Design',
  'Compare Glan, Wollaston, Rochon, and Senarmont polarizer designs using birefringent crystal prisms.',
  'https://photonics-calculators.vercel.app/polarization/birefringent-polarizer',
  { category: 'Polarization`,
  `https://photonics-calculators.vercel.app/polarization/birefringent-polarizer`,
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
