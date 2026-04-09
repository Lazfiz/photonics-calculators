import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/imaging/photoacoustic' },
    title: 'Photoacoustic Imaging Calculator',
  description: 'Imaging depth, resolution, and signal estimation for photoacoustic microscopy/tomography.'
};
const jsonLd = generateCalculatorJsonLd(
  `Photoacoustic Imaging Calculator',
  description: 'Imaging depth, resolution, and signal estimation for photoacoustic microscopy/tomography.'
};


const jsonLd = generateCalculatorJsonLd(
  'Photoacoustic Imaging Calculator',
  'Imaging depth, resolution, and signal estimation for photoacoustic microscopy/tomography.',
  'https://photonics-calculators.vercel.app/imaging/photoacoustic',
  { category: 'Imaging`,
  `Imaging depth, resolution, and signal estimation for photoacoustic microscopy/tomography.'
};


const jsonLd = generateCalculatorJsonLd(
  'Photoacoustic Imaging Calculator',
  'Imaging depth, resolution, and signal estimation for photoacoustic microscopy/tomography.',
  'https://photonics-calculators.vercel.app/imaging/photoacoustic',
  { category: 'Imaging`,
  `https://photonics-calculators.vercel.app/imaging/photoacoustic`,
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
