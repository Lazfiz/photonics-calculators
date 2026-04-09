import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/materials/birefringent-crystals' },
    title: 'Birefringent Crystals',
  description: 'Ordinary (nₒ) and extraordinary (nₑ) refractive indices',
};
const jsonLd = generateCalculatorJsonLd(
  `Birefringent Crystals',
  description: 'Ordinary (nₒ) and extraordinary (nₑ) refractive indices',
};


const jsonLd = generateCalculatorJsonLd(
  'Birefringent Crystals',
  'Ordinary (nₒ) and extraordinary (nₑ) refractive indices',
  'https://photonics-calculators.vercel.app/materials/birefringent-crystals',
  { category: 'Materials`,
  `Ordinary (nₒ) and extraordinary (nₑ) refractive indices',
};


const jsonLd = generateCalculatorJsonLd(
  'Birefringent Crystals',
  'Ordinary (nₒ) and extraordinary (nₑ) refractive indices',
  'https://photonics-calculators.vercel.app/materials/birefringent-crystals',
  { category: 'Materials`,
  `https://photonics-calculators.vercel.app/materials/birefringent-crystals`,
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
