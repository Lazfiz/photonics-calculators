import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/materials/coefficient-thermal-expansion' },
    title: 'Coefficient of Thermal Expansion',
  description: 'Thermal expansion of optical materials',
};
const jsonLd = generateCalculatorJsonLd(
  `Coefficient of Thermal Expansion',
  description: 'Thermal expansion of optical materials',
};


const jsonLd = generateCalculatorJsonLd(
  'Coefficient of Thermal Expansion',
  'Thermal expansion of optical materials',
  'https://photonics-calculators.vercel.app/materials/coefficient-thermal-expansion',
  { category: 'Materials`,
  `Thermal expansion of optical materials',
};


const jsonLd = generateCalculatorJsonLd(
  'Coefficient of Thermal Expansion',
  'Thermal expansion of optical materials',
  'https://photonics-calculators.vercel.app/materials/coefficient-thermal-expansion',
  { category: 'Materials`,
  `https://photonics-calculators.vercel.app/materials/coefficient-thermal-expansion`,
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
