import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/materials/damage-threshold' },
    title: 'Laser Damage Threshold',
  description: 'LIDT for pulsed and CW laser optics',
};
const jsonLd = generateCalculatorJsonLd(
  `Laser Damage Threshold',
  description: 'LIDT for pulsed and CW laser optics',
};


const jsonLd = generateCalculatorJsonLd(
  'Laser Damage Threshold',
  'LIDT for pulsed and CW laser optics',
  'https://photonics-calculators.vercel.app/materials/damage-threshold',
  { category: 'Materials`,
  `LIDT for pulsed and CW laser optics',
};


const jsonLd = generateCalculatorJsonLd(
  'Laser Damage Threshold',
  'LIDT for pulsed and CW laser optics',
  'https://photonics-calculators.vercel.app/materials/damage-threshold',
  { category: 'Materials`,
  `https://photonics-calculators.vercel.app/materials/damage-threshold`,
  { category: `Materials` }
);
export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}
