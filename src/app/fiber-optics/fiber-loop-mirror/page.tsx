import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/fiber-optics/fiber-loop-mirror' },
    title: 'Fiber Loop Mirror (Sagnac)',
  description: 'Sagnac fiber loop mirror reflectance, spectral response, and birefringent filter design.'
};
const jsonLd = generateCalculatorJsonLd(
  `Fiber Loop Mirror (Sagnac)',
  description: 'Sagnac fiber loop mirror reflectance, spectral response, and birefringent filter design.'
};


const jsonLd = generateCalculatorJsonLd(
  'Fiber Loop Mirror (Sagnac)',
  'Sagnac fiber loop mirror reflectance, spectral response, and birefringent filter design.',
  'https://photonics-calculators.vercel.app/fiber-optics/fiber-loop-mirror',
  { category: 'Fiber Optics`,
  `Sagnac fiber loop mirror reflectance, spectral response, and birefringent filter design.'
};


const jsonLd = generateCalculatorJsonLd(
  'Fiber Loop Mirror (Sagnac)',
  'Sagnac fiber loop mirror reflectance, spectral response, and birefringent filter design.',
  'https://photonics-calculators.vercel.app/fiber-optics/fiber-loop-mirror',
  { category: 'Fiber Optics`,
  `https://photonics-calculators.vercel.app/fiber-optics/fiber-loop-mirror`,
  { category: `Fiber Optics` }
);
export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}
