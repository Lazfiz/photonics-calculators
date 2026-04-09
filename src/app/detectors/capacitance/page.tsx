import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/detectors/capacitance' },
    title: 'Junction Capacitance',
  description: 'Photodiode junction capacitance vs reverse bias, doping profile, and RC bandwidth impact.'
};
const jsonLd = generateCalculatorJsonLd(
  `Junction Capacitance',
  description: 'Photodiode junction capacitance vs reverse bias, doping profile, and RC bandwidth impact.'
};


const jsonLd = generateCalculatorJsonLd(
  'Junction Capacitance',
  'Photodiode junction capacitance vs reverse bias, doping profile, and RC bandwidth impact.',
  'https://photonics-calculators.vercel.app/detectors/capacitance',
  { category: 'Detectors`,
  `Photodiode junction capacitance vs reverse bias, doping profile, and RC bandwidth impact.'
};


const jsonLd = generateCalculatorJsonLd(
  'Junction Capacitance',
  'Photodiode junction capacitance vs reverse bias, doping profile, and RC bandwidth impact.',
  'https://photonics-calculators.vercel.app/detectors/capacitance',
  { category: 'Detectors`,
  `https://photonics-calculators.vercel.app/detectors/capacitance`,
  { category: `Detectors` }
);
export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}
