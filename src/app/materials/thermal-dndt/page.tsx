import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/materials/thermal-dndt' },
    title: 'Thermo-Optic Coefficient (dn/dT)',
  description: 'Temperature-dependent refractive index change. Positive dn/dT means n increases with temperature.'
};
const jsonLd = generateCalculatorJsonLd(
  `Thermo-Optic Coefficient (dn/dT)',
  description: 'Temperature-dependent refractive index change. Positive dn/dT means n increases with temperature.'
};


const jsonLd = generateCalculatorJsonLd(
  'Thermo-Optic Coefficient (dn/dT)',
  'Temperature-dependent refractive index change. Positive dn/dT means n increases with temperature.',
  'https://photonics-calculators.vercel.app/materials/thermal-dndt',
  { category: 'Materials`,
  `Temperature-dependent refractive index change. Positive dn/dT means n increases with temperature.'
};


const jsonLd = generateCalculatorJsonLd(
  'Thermo-Optic Coefficient (dn/dT)',
  'Temperature-dependent refractive index change. Positive dn/dT means n increases with temperature.',
  'https://photonics-calculators.vercel.app/materials/thermal-dndt',
  { category: 'Materials`,
  `https://photonics-calculators.vercel.app/materials/thermal-dndt`,
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
