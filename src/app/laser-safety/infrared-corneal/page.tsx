import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/laser-safety/infrared-corneal' },
    title: 'IR Corneal Exposure',
  description: 'Interactive IR Corneal Exposure calculator for photonics and optical engineering.'
};
const jsonLd = generateCalculatorJsonLd(
  `IR Corneal Exposure',
  description: 'Interactive IR Corneal Exposure calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'IR Corneal Exposure',
  'Interactive IR Corneal Exposure calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/laser-safety/infrared-corneal',
  { category: 'Laser Safety`,
  `Interactive IR Corneal Exposure calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'IR Corneal Exposure',
  'Interactive IR Corneal Exposure calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/laser-safety/infrared-corneal',
  { category: 'Laser Safety`,
  `https://photonics-calculators.vercel.app/laser-safety/infrared-corneal`,
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
