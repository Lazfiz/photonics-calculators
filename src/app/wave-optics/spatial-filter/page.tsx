import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/wave-optics/spatial-filter' },
    title: 'Spatial Filter Pinhole Sizing',
  description: 'Calculate optimal pinhole diameter for spatial filtering.'
};
const jsonLd = generateCalculatorJsonLd(
  `Spatial Filter Pinhole Sizing',
  description: 'Calculate optimal pinhole diameter for spatial filtering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Spatial Filter Pinhole Sizing',
  'Calculate optimal pinhole diameter for spatial filtering.',
  'https://photonics-calculators.vercel.app/wave-optics/spatial-filter',
  { category: 'Wave Optics`,
  `Calculate optimal pinhole diameter for spatial filtering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Spatial Filter Pinhole Sizing',
  'Calculate optimal pinhole diameter for spatial filtering.',
  'https://photonics-calculators.vercel.app/wave-optics/spatial-filter',
  { category: 'Wave Optics`,
  `https://photonics-calculators.vercel.app/wave-optics/spatial-filter`,
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
