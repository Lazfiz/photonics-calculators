import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/materials/crystal-birefringence' },
    title: 'Crystal Birefringence Data',
  description: 'n = |nₒ − nₑ| for uniaxial and birefringent crystals at selected wavelength',
};
const jsonLd = generateCalculatorJsonLd(
  `Crystal Birefringence Data',
  description: 'n = |nₒ − nₑ| for uniaxial and birefringent crystals at selected wavelength',
};


const jsonLd = generateCalculatorJsonLd(
  'Crystal Birefringence Data',
  'n = |nₒ − nₑ| for uniaxial and birefringent crystals at selected wavelength',
  'https://photonics-calculators.vercel.app/materials/crystal-birefringence',
  { category: 'Materials`,
  `n = |nₒ − nₑ| for uniaxial and birefringent crystals at selected wavelength',
};


const jsonLd = generateCalculatorJsonLd(
  'Crystal Birefringence Data',
  'n = |nₒ − nₑ| for uniaxial and birefringent crystals at selected wavelength',
  'https://photonics-calculators.vercel.app/materials/crystal-birefringence',
  { category: 'Materials`,
  `https://photonics-calculators.vercel.app/materials/crystal-birefringence`,
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
