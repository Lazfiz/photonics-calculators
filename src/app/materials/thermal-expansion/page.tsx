import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/materials/thermal-expansion' },
      title: 'Thermal Expansion',
  description: 'L = T L — dimensional change from temperature',
};
const jsonLd = generateCalculatorJsonLd(
  `Thermal Expansion',
  description: 'L = T L — dimensional change from temperature',
};


const jsonLd = generateCalculatorJsonLd(
  'Thermal Expansion',
  'L = T L — dimensional change from temperature',
  'https://photonics-calculators.vercel.app/materials/thermal-expansion',
  { category: 'Materials`,
  `L = T L — dimensional change from temperature',
};


const jsonLd = generateCalculatorJsonLd(
  'Thermal Expansion',
  'L = T L — dimensional change from temperature',
  'https://photonics-calculators.vercel.app/materials/thermal-expansion',
  { category: 'Materials`,
  `https://photonics-calculators.vercel.app/materials/thermal-expansion`,
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
