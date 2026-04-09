import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/wave-optics/free-electron-laser' },
    title: 'Free Electron Laser',
  description: 'Interactive Free Electron Laser calculator for photonics and optical engineering.'
};
const jsonLd = generateCalculatorJsonLd(
  `Free Electron Laser',
  description: 'Interactive Free Electron Laser calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Free Electron Laser',
  'Interactive Free Electron Laser calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/wave-optics/free-electron-laser',
  { category: 'Wave Optics`,
  `Interactive Free Electron Laser calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Free Electron Laser',
  'Interactive Free Electron Laser calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/wave-optics/free-electron-laser',
  { category: 'Wave Optics`,
  `https://photonics-calculators.vercel.app/wave-optics/free-electron-laser`,
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
