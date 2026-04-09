import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/materials/electro-optic' },
    title: 'Electro-Optic Coefficients',
  description: 'Pockels effect materials for modulators, Q-switches, and phase shifters',
};
const jsonLd = generateCalculatorJsonLd(
  `Electro-Optic Coefficients',
  description: 'Pockels effect materials for modulators, Q-switches, and phase shifters',
};


const jsonLd = generateCalculatorJsonLd(
  'Electro-Optic Coefficients',
  'Pockels effect materials for modulators, Q-switches, and phase shifters',
  'https://photonics-calculators.vercel.app/materials/electro-optic',
  { category: 'Materials`,
  `Pockels effect materials for modulators, Q-switches, and phase shifters',
};


const jsonLd = generateCalculatorJsonLd(
  'Electro-Optic Coefficients',
  'Pockels effect materials for modulators, Q-switches, and phase shifters',
  'https://photonics-calculators.vercel.app/materials/electro-optic',
  { category: 'Materials`,
  `https://photonics-calculators.vercel.app/materials/electro-optic`,
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
