import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/imaging/light-sheet' },
    title: 'Light Sheet Microscopy Calculator',
  description: 'Light sheet thickness, resolution, and Rayleigh range for LSFM/SPIM.'
};
const jsonLd = generateCalculatorJsonLd(
  `Light Sheet Microscopy Calculator',
  description: 'Light sheet thickness, resolution, and Rayleigh range for LSFM/SPIM.'
};


const jsonLd = generateCalculatorJsonLd(
  'Light Sheet Microscopy Calculator',
  'Light sheet thickness, resolution, and Rayleigh range for LSFM/SPIM.',
  'https://photonics-calculators.vercel.app/imaging/light-sheet',
  { category: 'Imaging`,
  `Light sheet thickness, resolution, and Rayleigh range for LSFM/SPIM.'
};


const jsonLd = generateCalculatorJsonLd(
  'Light Sheet Microscopy Calculator',
  'Light sheet thickness, resolution, and Rayleigh range for LSFM/SPIM.',
  'https://photonics-calculators.vercel.app/imaging/light-sheet',
  { category: 'Imaging`,
  `https://photonics-calculators.vercel.app/imaging/light-sheet`,
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
