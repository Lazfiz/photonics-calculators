import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/materials/acousto-optic' },
    title: 'Acousto-Optic Materials',
  description: 'Acousto-optic figure of merit, Bragg angle, and deflection calculations',
};
const jsonLd = generateCalculatorJsonLd(
  `Acousto-Optic Materials',
  description: 'Acousto-optic figure of merit, Bragg angle, and deflection calculations',
};


const jsonLd = generateCalculatorJsonLd(
  'Acousto-Optic Materials',
  'Acousto-optic figure of merit, Bragg angle, and deflection calculations',
  'https://photonics-calculators.vercel.app/materials/acousto-optic',
  { category: 'Materials`,
  `Acousto-optic figure of merit, Bragg angle, and deflection calculations',
};


const jsonLd = generateCalculatorJsonLd(
  'Acousto-Optic Materials',
  'Acousto-optic figure of merit, Bragg angle, and deflection calculations',
  'https://photonics-calculators.vercel.app/materials/acousto-optic',
  { category: 'Materials`,
  `https://photonics-calculators.vercel.app/materials/acousto-optic`,
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
