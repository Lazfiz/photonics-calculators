import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/wave-optics/photonic-bandgap' },
    title: 'Photonic Bandgap',
  description: '1D photonic crystal band structure and reflectivity.'
};
const jsonLd = generateCalculatorJsonLd(
  `Photonic Bandgap',
  description: '1D photonic crystal band structure and reflectivity.'
};


const jsonLd = generateCalculatorJsonLd(
  'Photonic Bandgap',
  '1D photonic crystal band structure and reflectivity.',
  'https://photonics-calculators.vercel.app/wave-optics/photonic-bandgap',
  { category: 'Wave Optics`,
  `1D photonic crystal band structure and reflectivity.'
};


const jsonLd = generateCalculatorJsonLd(
  'Photonic Bandgap',
  '1D photonic crystal band structure and reflectivity.',
  'https://photonics-calculators.vercel.app/wave-optics/photonic-bandgap',
  { category: 'Wave Optics`,
  `https://photonics-calculators.vercel.app/wave-optics/photonic-bandgap`,
  { category: `Wave Optics` }
);
export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}
