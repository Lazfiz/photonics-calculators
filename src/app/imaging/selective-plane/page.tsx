import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/imaging/selective-plane' },
    title: 'Selective Plane Illumination Calculator',
  description: 'SPIM illumination parameters: sheet thickness, beam waist, Rayleigh range, and confocal parameter.'
};
const jsonLd = generateCalculatorJsonLd(
  `Selective Plane Illumination Calculator',
  description: 'SPIM illumination parameters: sheet thickness, beam waist, Rayleigh range, and confocal parameter.'
};


const jsonLd = generateCalculatorJsonLd(
  'Selective Plane Illumination Calculator',
  'SPIM illumination parameters: sheet thickness, beam waist, Rayleigh range, and confocal parameter.',
  'https://photonics-calculators.vercel.app/imaging/selective-plane',
  { category: 'Imaging`,
  `SPIM illumination parameters: sheet thickness, beam waist, Rayleigh range, and confocal parameter.'
};


const jsonLd = generateCalculatorJsonLd(
  'Selective Plane Illumination Calculator',
  'SPIM illumination parameters: sheet thickness, beam waist, Rayleigh range, and confocal parameter.',
  'https://photonics-calculators.vercel.app/imaging/selective-plane',
  { category: 'Imaging`,
  `https://photonics-calculators.vercel.app/imaging/selective-plane`,
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
