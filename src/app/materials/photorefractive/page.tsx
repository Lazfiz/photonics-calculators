import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/materials/photorefractive' },
    title: 'Photorefractive Effect',
  description: 'Light-induced refractive index changes via space-charge fields in electro-optic materials. Key for holographic storage, phase conjugation, and beam coupling.'
};
const jsonLd = generateCalculatorJsonLd(
  `Photorefractive Effect',
  description: 'Light-induced refractive index changes via space-charge fields in electro-optic materials. Key for holographic storage, phase conjugation, and beam coupling.'
};


const jsonLd = generateCalculatorJsonLd(
  'Photorefractive Effect',
  'Light-induced refractive index changes via space-charge fields in electro-optic materials. Key for holographic storage, phase conjugation, and beam coupling.',
  'https://photonics-calculators.vercel.app/materials/photorefractive',
  { category: 'Materials`,
  `Light-induced refractive index changes via space-charge fields in electro-optic materials. Key for holographic storage, phase conjugation, and beam coupling.'
};


const jsonLd = generateCalculatorJsonLd(
  'Photorefractive Effect',
  'Light-induced refractive index changes via space-charge fields in electro-optic materials. Key for holographic storage, phase conjugation, and beam coupling.',
  'https://photonics-calculators.vercel.app/materials/photorefractive',
  { category: 'Materials`,
  `https://photonics-calculators.vercel.app/materials/photorefractive`,
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
