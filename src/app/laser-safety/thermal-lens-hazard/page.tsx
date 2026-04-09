import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/laser-safety/thermal-lens-hazard' },
    title: 'Thermal Lens Hazard',
  description: 'Evaluate thermal lensing risk to protective eyewear and optical components from absorbed laser power.'
};
const jsonLd = generateCalculatorJsonLd(
  `Thermal Lens Hazard',
  description: 'Evaluate thermal lensing risk to protective eyewear and optical components from absorbed laser power.'
};


const jsonLd = generateCalculatorJsonLd(
  'Thermal Lens Hazard',
  'Evaluate thermal lensing risk to protective eyewear and optical components from absorbed laser power.',
  'https://photonics-calculators.vercel.app/laser-safety/thermal-lens-hazard',
  { category: 'Laser Safety`,
  `Evaluate thermal lensing risk to protective eyewear and optical components from absorbed laser power.'
};


const jsonLd = generateCalculatorJsonLd(
  'Thermal Lens Hazard',
  'Evaluate thermal lensing risk to protective eyewear and optical components from absorbed laser power.',
  'https://photonics-calculators.vercel.app/laser-safety/thermal-lens-hazard',
  { category: 'Laser Safety`,
  `https://photonics-calculators.vercel.app/laser-safety/thermal-lens-hazard`,
  { category: `Laser Safety` }
);
export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}
