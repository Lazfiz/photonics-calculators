import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/imaging/light-sheet-thickness' },
    title: 'Light Sheet Thickness Calculator',
  description: 'Calculate the thickness and propagation characteristics of a Gaussian light sheet for light-sheet fluorescence microscopy (LSFM).',
};
const jsonLd = generateCalculatorJsonLd(
  `Light Sheet Thickness Calculator',
  description: 'Calculate the thickness and propagation characteristics of a Gaussian light sheet for light-sheet fluorescence microscopy (LSFM).',
};


const jsonLd = generateCalculatorJsonLd(
  'Light Sheet Thickness Calculator',
  'Calculate the thickness and propagation characteristics of a Gaussian light sheet for light-sheet fluorescence microscopy (LSFM).',
  'https://photonics-calculators.vercel.app/imaging/light-sheet-thickness',
  { category: 'Imaging`,
  `Calculate the thickness and propagation characteristics of a Gaussian light sheet for light-sheet fluorescence microscopy (LSFM).',
};


const jsonLd = generateCalculatorJsonLd(
  'Light Sheet Thickness Calculator',
  'Calculate the thickness and propagation characteristics of a Gaussian light sheet for light-sheet fluorescence microscopy (LSFM).',
  'https://photonics-calculators.vercel.app/imaging/light-sheet-thickness',
  { category: 'Imaging`,
  `https://photonics-calculators.vercel.app/imaging/light-sheet-thickness`,
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
