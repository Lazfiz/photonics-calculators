import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/wave-optics/optical-waveguide' },
    title: 'Optical Waveguide Modes',
  description: 'Slab waveguide mode analysis: V-number, NA, and effective index.'
};
const jsonLd = generateCalculatorJsonLd(
  `Optical Waveguide Modes',
  description: 'Slab waveguide mode analysis: V-number, NA, and effective index.'
};


const jsonLd = generateCalculatorJsonLd(
  'Optical Waveguide Modes',
  'Slab waveguide mode analysis: V-number, NA, and effective index.',
  'https://photonics-calculators.vercel.app/wave-optics/optical-waveguide',
  { category: 'Wave Optics`,
  `Slab waveguide mode analysis: V-number, NA, and effective index.'
};


const jsonLd = generateCalculatorJsonLd(
  'Optical Waveguide Modes',
  'Slab waveguide mode analysis: V-number, NA, and effective index.',
  'https://photonics-calculators.vercel.app/wave-optics/optical-waveguide',
  { category: 'Wave Optics`,
  `https://photonics-calculators.vercel.app/wave-optics/optical-waveguide`,
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
