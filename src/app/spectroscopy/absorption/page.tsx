import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/spectroscopy/absorption' },
      title: 'Beer-Lambert Absorption',
  description: 'A = cl — absorbance from molar extinction coefficient, concentration, and path length.',
};
const jsonLd = generateCalculatorJsonLd(
  `Beer-Lambert Absorption',
  description: 'A = cl — absorbance from molar extinction coefficient, concentration, and path length.',
};


const jsonLd = generateCalculatorJsonLd(
  'Beer-Lambert Absorption',
  'A = cl — absorbance from molar extinction coefficient, concentration, and path length.',
  'https://photonics-calculators.vercel.app/spectroscopy/absorption',
  { category: 'Spectroscopy`,
  `A = cl — absorbance from molar extinction coefficient, concentration, and path length.',
};


const jsonLd = generateCalculatorJsonLd(
  'Beer-Lambert Absorption',
  'A = cl — absorbance from molar extinction coefficient, concentration, and path length.',
  'https://photonics-calculators.vercel.app/spectroscopy/absorption',
  { category: 'Spectroscopy`,
  `https://photonics-calculators.vercel.app/spectroscopy/absorption`,
  { category: `Spectroscopy` }
);
export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}
