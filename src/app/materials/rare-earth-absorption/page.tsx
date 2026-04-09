import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/materials/rare-earth-absorption' },
    title: 'Rare Earth Absorption Spectra',
  description: 'Absorption cross-sections for common rare-earth dopants in silica: Er³⁺, Nd³⁺, Yb³⁺, Tm³⁺, Ho³⁺.',
};
const jsonLd = generateCalculatorJsonLd(
  `Rare Earth Absorption Spectra',
  description: 'Absorption cross-sections for common rare-earth dopants in silica: Er³⁺, Nd³⁺, Yb³⁺, Tm³⁺, Ho³⁺.',
};


const jsonLd = generateCalculatorJsonLd(
  'Rare Earth Absorption Spectra',
  'Absorption cross-sections for common rare-earth dopants in silica: Er³⁺, Nd³⁺, Yb³⁺, Tm³⁺, Ho³⁺.',
  'https://photonics-calculators.vercel.app/materials/rare-earth-absorption',
  { category: 'Materials`,
  `Absorption cross-sections for common rare-earth dopants in silica: Er³⁺, Nd³⁺, Yb³⁺, Tm³⁺, Ho³⁺.',
};


const jsonLd = generateCalculatorJsonLd(
  'Rare Earth Absorption Spectra',
  'Absorption cross-sections for common rare-earth dopants in silica: Er³⁺, Nd³⁺, Yb³⁺, Tm³⁺, Ho³⁺.',
  'https://photonics-calculators.vercel.app/materials/rare-earth-absorption',
  { category: 'Materials`,
  `https://photonics-calculators.vercel.app/materials/rare-earth-absorption`,
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
