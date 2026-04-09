import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/polarization/poincare-sphere' },
    title: 'Poincaré Sphere',
  description: 'Interactive visualization of polarization states on the Poincaré sphere.'
};
const jsonLd = generateCalculatorJsonLd(
  `Poincaré Sphere',
  description: 'Interactive visualization of polarization states on the Poincaré sphere.'
};


const jsonLd = generateCalculatorJsonLd(
  'Poincaré Sphere',
  'Interactive visualization of polarization states on the Poincaré sphere.',
  'https://photonics-calculators.vercel.app/polarization/poincare-sphere',
  { category: 'Polarization`,
  `Interactive visualization of polarization states on the Poincaré sphere.'
};


const jsonLd = generateCalculatorJsonLd(
  'Poincaré Sphere',
  'Interactive visualization of polarization states on the Poincaré sphere.',
  'https://photonics-calculators.vercel.app/polarization/poincare-sphere',
  { category: 'Polarization`,
  `https://photonics-calculators.vercel.app/polarization/poincare-sphere`,
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
