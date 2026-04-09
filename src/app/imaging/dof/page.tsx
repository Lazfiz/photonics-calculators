import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/imaging/dof' },
    title: 'Depth of Field',
  description: 'Microscope depth of field including diffraction and detector contributions.'
};
const jsonLd = generateCalculatorJsonLd(
  `Depth of Field',
  description: 'Microscope depth of field including diffraction and detector contributions.'
};


const jsonLd = generateCalculatorJsonLd(
  'Depth of Field',
  'Microscope depth of field including diffraction and detector contributions.',
  'https://photonics-calculators.vercel.app/imaging/dof',
  { category: 'Imaging`,
  `Microscope depth of field including diffraction and detector contributions.'
};


const jsonLd = generateCalculatorJsonLd(
  'Depth of Field',
  'Microscope depth of field including diffraction and detector contributions.',
  'https://photonics-calculators.vercel.app/imaging/dof',
  { category: 'Imaging`,
  `https://photonics-calculators.vercel.app/imaging/dof`,
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
