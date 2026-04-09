import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/wave-optics/thin-disk-laser' },
    title: 'Thin Disk Laser',
  description: 'Interactive Thin Disk Laser calculator for photonics and optical engineering.'
};
const jsonLd = generateCalculatorJsonLd(
  `Thin Disk Laser',
  description: 'Interactive Thin Disk Laser calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Thin Disk Laser',
  'Interactive Thin Disk Laser calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/wave-optics/thin-disk-laser',
  { category: 'Wave Optics`,
  `Interactive Thin Disk Laser calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Thin Disk Laser',
  'Interactive Thin Disk Laser calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/wave-optics/thin-disk-laser',
  { category: 'Wave Optics`,
  `https://photonics-calculators.vercel.app/wave-optics/thin-disk-laser`,
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
