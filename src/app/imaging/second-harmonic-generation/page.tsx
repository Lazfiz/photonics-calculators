import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/imaging/second-harmonic-generation' },
    title: 'Second Harmonic Generation (SHG) Calculator',
  description: 'SHG signal properties, wavelength conversion, and imaging resolution for collagen and other non-centrosymmetric structures.'
};
const jsonLd = generateCalculatorJsonLd(
  `Second Harmonic Generation (SHG) Calculator',
  description: 'SHG signal properties, wavelength conversion, and imaging resolution for collagen and other non-centrosymmetric structures.'
};


const jsonLd = generateCalculatorJsonLd(
  'Second Harmonic Generation (SHG) Calculator',
  'SHG signal properties, wavelength conversion, and imaging resolution for collagen and other non-centrosymmetric structures.',
  'https://photonics-calculators.vercel.app/imaging/second-harmonic-generation',
  { category: 'Imaging`,
  `SHG signal properties, wavelength conversion, and imaging resolution for collagen and other non-centrosymmetric structures.'
};


const jsonLd = generateCalculatorJsonLd(
  'Second Harmonic Generation (SHG) Calculator',
  'SHG signal properties, wavelength conversion, and imaging resolution for collagen and other non-centrosymmetric structures.',
  'https://photonics-calculators.vercel.app/imaging/second-harmonic-generation',
  { category: 'Imaging`,
  `https://photonics-calculators.vercel.app/imaging/second-harmonic-generation`,
  { category: `Imaging` }
);
export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}
