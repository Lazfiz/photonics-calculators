import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/materials/thermal-conductivity-optics' },
    title: 'Thermal Conductivity for Optics',
  description: 'Heat transport in optical substrates',
};
const jsonLd = generateCalculatorJsonLd(
  `Thermal Conductivity for Optics',
  description: 'Heat transport in optical substrates',
};


const jsonLd = generateCalculatorJsonLd(
  'Thermal Conductivity for Optics',
  'Heat transport in optical substrates',
  'https://photonics-calculators.vercel.app/materials/thermal-conductivity-optics',
  { category: 'Materials`,
  `Heat transport in optical substrates',
};


const jsonLd = generateCalculatorJsonLd(
  'Thermal Conductivity for Optics',
  'Heat transport in optical substrates',
  'https://photonics-calculators.vercel.app/materials/thermal-conductivity-optics',
  { category: 'Materials`,
  `https://photonics-calculators.vercel.app/materials/thermal-conductivity-optics`,
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
