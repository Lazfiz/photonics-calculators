import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/materials/sapphire-properties' },
    title: 'Sapphire (AlO₃) Properties',
  description: 'Uniaxial crystal. Sellmeier equations for ordinary and extraordinary rays.'
};
const jsonLd = generateCalculatorJsonLd(
  `Sapphire (AlO₃) Properties',
  description: 'Uniaxial crystal. Sellmeier equations for ordinary and extraordinary rays.'
};


const jsonLd = generateCalculatorJsonLd(
  'Sapphire (AlO₃) Properties',
  'Uniaxial crystal. Sellmeier equations for ordinary and extraordinary rays.',
  'https://photonics-calculators.vercel.app/materials/sapphire-properties',
  { category: 'Materials`,
  `Uniaxial crystal. Sellmeier equations for ordinary and extraordinary rays.'
};


const jsonLd = generateCalculatorJsonLd(
  'Sapphire (AlO₃) Properties',
  'Uniaxial crystal. Sellmeier equations for ordinary and extraordinary rays.',
  'https://photonics-calculators.vercel.app/materials/sapphire-properties',
  { category: 'Materials`,
  `https://photonics-calculators.vercel.app/materials/sapphire-properties`,
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
