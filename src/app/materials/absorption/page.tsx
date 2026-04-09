import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/materials/absorption' },
      title: 'Absorption Coefficient',
  description: 'Wavelength-dependent absorption coefficient () and transmission through material thickness.',
};
const jsonLd = generateCalculatorJsonLd(
  `Absorption Coefficient',
  description: 'Wavelength-dependent absorption coefficient () and transmission through material thickness.',
};


const jsonLd = generateCalculatorJsonLd(
  'Absorption Coefficient',
  'Wavelength-dependent absorption coefficient () and transmission through material thickness.',
  'https://photonics-calculators.vercel.app/materials/absorption',
  { category: 'Materials`,
  `Wavelength-dependent absorption coefficient () and transmission through material thickness.',
};


const jsonLd = generateCalculatorJsonLd(
  'Absorption Coefficient',
  'Wavelength-dependent absorption coefficient () and transmission through material thickness.',
  'https://photonics-calculators.vercel.app/materials/absorption',
  { category: 'Materials`,
  `https://photonics-calculators.vercel.app/materials/absorption`,
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
