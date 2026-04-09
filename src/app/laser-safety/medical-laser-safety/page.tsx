import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/laser-safety/medical-laser-safety' },
    title: 'Medical Laser Safety Calculator',
  description: 'Analyze irradiance, fluence, thermal relaxation, and OD for medical/surgical laser systems.'
};
const jsonLd = generateCalculatorJsonLd(
  `Medical Laser Safety Calculator',
  description: 'Analyze irradiance, fluence, thermal relaxation, and OD for medical/surgical laser systems.'
};


const jsonLd = generateCalculatorJsonLd(
  'Medical Laser Safety Calculator',
  'Analyze irradiance, fluence, thermal relaxation, and OD for medical/surgical laser systems.',
  'https://photonics-calculators.vercel.app/laser-safety/medical-laser-safety',
  { category: 'Laser Safety`,
  `Analyze irradiance, fluence, thermal relaxation, and OD for medical/surgical laser systems.'
};


const jsonLd = generateCalculatorJsonLd(
  'Medical Laser Safety Calculator',
  'Analyze irradiance, fluence, thermal relaxation, and OD for medical/surgical laser systems.',
  'https://photonics-calculators.vercel.app/laser-safety/medical-laser-safety',
  { category: 'Laser Safety`,
  `https://photonics-calculators.vercel.app/laser-safety/medical-laser-safety`,
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
