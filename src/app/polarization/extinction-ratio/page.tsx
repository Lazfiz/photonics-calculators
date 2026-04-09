import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/polarization/extinction-ratio' },
    title: 'Extinction Ratio',
  description: 'Calculate polarizer extinction ratio, transmission, and cascaded performance.'
};
const jsonLd = generateCalculatorJsonLd(
  `Extinction Ratio',
  description: 'Calculate polarizer extinction ratio, transmission, and cascaded performance.'
};


const jsonLd = generateCalculatorJsonLd(
  'Extinction Ratio',
  'Calculate polarizer extinction ratio, transmission, and cascaded performance.',
  'https://photonics-calculators.vercel.app/polarization/extinction-ratio',
  { category: 'Polarization`,
  `Calculate polarizer extinction ratio, transmission, and cascaded performance.'
};


const jsonLd = generateCalculatorJsonLd(
  'Extinction Ratio',
  'Calculate polarizer extinction ratio, transmission, and cascaded performance.',
  'https://photonics-calculators.vercel.app/polarization/extinction-ratio',
  { category: 'Polarization`,
  `https://photonics-calculators.vercel.app/polarization/extinction-ratio`,
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
