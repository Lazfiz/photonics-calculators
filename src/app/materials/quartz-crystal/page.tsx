import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/materials/quartz-crystal' },
      title: 'Quartz Crystal (SiO) Properties',
  description: 'Uniaxial positive, optically active, piezoelectric. Sellmeier dispersion for o & e rays.',
};
const jsonLd = generateCalculatorJsonLd(
  `Quartz Crystal (SiO) Properties',
  description: 'Uniaxial positive, optically active, piezoelectric. Sellmeier dispersion for o & e rays.',
};


const jsonLd = generateCalculatorJsonLd(
  'Quartz Crystal (SiO) Properties',
  'Uniaxial positive, optically active, piezoelectric. Sellmeier dispersion for o & e rays.',
  'https://photonics-calculators.vercel.app/materials/quartz-crystal',
  { category: 'Materials`,
  `Uniaxial positive, optically active, piezoelectric. Sellmeier dispersion for o & e rays.',
};


const jsonLd = generateCalculatorJsonLd(
  'Quartz Crystal (SiO) Properties',
  'Uniaxial positive, optically active, piezoelectric. Sellmeier dispersion for o & e rays.',
  'https://photonics-calculators.vercel.app/materials/quartz-crystal',
  { category: 'Materials`,
  `https://photonics-calculators.vercel.app/materials/quartz-crystal`,
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
