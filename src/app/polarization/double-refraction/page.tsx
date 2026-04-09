import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/polarization/double-refraction' },
    title: 'Double Refraction (Birefringence)',
  description: 'Calculate ordinary and extraordinary ray paths, walk-off angle, lateral separation, and retardation in uniaxial crystals.'
};
const jsonLd = generateCalculatorJsonLd(
  `Double Refraction (Birefringence)',
  description: 'Calculate ordinary and extraordinary ray paths, walk-off angle, lateral separation, and retardation in uniaxial crystals.'
};


const jsonLd = generateCalculatorJsonLd(
  'Double Refraction (Birefringence)',
  'Calculate ordinary and extraordinary ray paths, walk-off angle, lateral separation, and retardation in uniaxial crystals.',
  'https://photonics-calculators.vercel.app/polarization/double-refraction',
  { category: 'Polarization`,
  `Calculate ordinary and extraordinary ray paths, walk-off angle, lateral separation, and retardation in uniaxial crystals.'
};


const jsonLd = generateCalculatorJsonLd(
  'Double Refraction (Birefringence)',
  'Calculate ordinary and extraordinary ray paths, walk-off angle, lateral separation, and retardation in uniaxial crystals.',
  'https://photonics-calculators.vercel.app/polarization/double-refraction',
  { category: 'Polarization`,
  `https://photonics-calculators.vercel.app/polarization/double-refraction`,
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
