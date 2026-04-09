import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/materials/radiation-damage' },
    title: 'Radiation Damage Effects',
  description: 'Radiation-induced absorption and transmission loss in optical materials',
};
const jsonLd = generateCalculatorJsonLd(
  `Radiation Damage Effects',
  description: 'Radiation-induced absorption and transmission loss in optical materials',
};


const jsonLd = generateCalculatorJsonLd(
  'Radiation Damage Effects',
  'Radiation-induced absorption and transmission loss in optical materials',
  'https://photonics-calculators.vercel.app/materials/radiation-damage',
  { category: 'Materials`,
  `Radiation-induced absorption and transmission loss in optical materials',
};


const jsonLd = generateCalculatorJsonLd(
  'Radiation Damage Effects',
  'Radiation-induced absorption and transmission loss in optical materials',
  'https://photonics-calculators.vercel.app/materials/radiation-damage',
  { category: 'Materials`,
  `https://photonics-calculators.vercel.app/materials/radiation-damage`,
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
