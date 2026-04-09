import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/spectroscopy/electron-spectroscopy' },
    title: 'Electron Spectroscopy (XPS/UPS)',
  description: 'Photoelectron spectroscopy for surface composition, chemical state, and electronic structure.'
};
const jsonLd = generateCalculatorJsonLd(
  `Electron Spectroscopy (XPS/UPS)',
  description: 'Photoelectron spectroscopy for surface composition, chemical state, and electronic structure.'
};


const jsonLd = generateCalculatorJsonLd(
  'Electron Spectroscopy (XPS/UPS)',
  'Photoelectron spectroscopy for surface composition, chemical state, and electronic structure.',
  'https://photonics-calculators.vercel.app/spectroscopy/electron-spectroscopy',
  { category: 'Spectroscopy`,
  `Photoelectron spectroscopy for surface composition, chemical state, and electronic structure.'
};


const jsonLd = generateCalculatorJsonLd(
  'Electron Spectroscopy (XPS/UPS)',
  'Photoelectron spectroscopy for surface composition, chemical state, and electronic structure.',
  'https://photonics-calculators.vercel.app/spectroscopy/electron-spectroscopy',
  { category: 'Spectroscopy`,
  `https://photonics-calculators.vercel.app/spectroscopy/electron-spectroscopy`,
  { category: `Spectroscopy` }
);
export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}
