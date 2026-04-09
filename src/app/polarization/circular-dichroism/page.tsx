import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/polarization/circular-dichroism' },
    title: 'Circular Dichroism',
  description: 'Calculate CD parameters: A, , molar ellipticity, and g-factor from absorbance of left and right circularly polarized light.'
};
const jsonLd = generateCalculatorJsonLd(
  `Circular Dichroism',
  description: 'Calculate CD parameters: A, , molar ellipticity, and g-factor from absorbance of left and right circularly polarized light.'
};


const jsonLd = generateCalculatorJsonLd(
  'Circular Dichroism',
  'Calculate CD parameters: A, , molar ellipticity, and g-factor from absorbance of left and right circularly polarized light.',
  'https://photonics-calculators.vercel.app/polarization/circular-dichroism',
  { category: 'Polarization`,
  `Calculate CD parameters: A, , molar ellipticity, and g-factor from absorbance of left and right circularly polarized light.'
};


const jsonLd = generateCalculatorJsonLd(
  'Circular Dichroism',
  'Calculate CD parameters: A, , molar ellipticity, and g-factor from absorbance of left and right circularly polarized light.',
  'https://photonics-calculators.vercel.app/polarization/circular-dichroism',
  { category: 'Polarization`,
  `https://photonics-calculators.vercel.app/polarization/circular-dichroism`,
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
