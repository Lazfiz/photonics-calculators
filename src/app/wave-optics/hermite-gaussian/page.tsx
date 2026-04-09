import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/wave-optics/hermite-gaussian' },
    title: 'Hermite-Gaussian Modes (TEMmn)',
  description: 'Rectangular higher-order Gaussian beam modes.'
};
const jsonLd = generateCalculatorJsonLd(
  `Hermite-Gaussian Modes (TEMmn)',
  description: 'Rectangular higher-order Gaussian beam modes.'
};


const jsonLd = generateCalculatorJsonLd(
  'Hermite-Gaussian Modes (TEMmn)',
  'Rectangular higher-order Gaussian beam modes.',
  'https://photonics-calculators.vercel.app/wave-optics/hermite-gaussian',
  { category: 'Wave Optics`,
  `Rectangular higher-order Gaussian beam modes.'
};


const jsonLd = generateCalculatorJsonLd(
  'Hermite-Gaussian Modes (TEMmn)',
  'Rectangular higher-order Gaussian beam modes.',
  'https://photonics-calculators.vercel.app/wave-optics/hermite-gaussian',
  { category: 'Wave Optics`,
  `https://photonics-calculators.vercel.app/wave-optics/hermite-gaussian`,
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
