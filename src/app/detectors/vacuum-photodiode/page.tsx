import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/detectors/vacuum-photodiode' },
    title: 'Vacuum Photodiode',
  description: 'Vacuum photodiode calculator. Models photoemission, responsivity, dark current (thermionic emission), and frequency response.'
};
const jsonLd = generateCalculatorJsonLd(
  `Vacuum Photodiode',
  description: 'Vacuum photodiode calculator. Models photoemission, responsivity, dark current (thermionic emission), and frequency response.'
};


const jsonLd = generateCalculatorJsonLd(
  'Vacuum Photodiode',
  'Vacuum photodiode calculator. Models photoemission, responsivity, dark current (thermionic emission), and frequency response.',
  'https://photonics-calculators.vercel.app/detectors/vacuum-photodiode',
  { category: 'Detectors`,
  `Vacuum photodiode calculator. Models photoemission, responsivity, dark current (thermionic emission), and frequency response.'
};


const jsonLd = generateCalculatorJsonLd(
  'Vacuum Photodiode',
  'Vacuum photodiode calculator. Models photoemission, responsivity, dark current (thermionic emission), and frequency response.',
  'https://photonics-calculators.vercel.app/detectors/vacuum-photodiode',
  { category: 'Detectors`,
  `https://photonics-calculators.vercel.app/detectors/vacuum-photodiode`,
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
