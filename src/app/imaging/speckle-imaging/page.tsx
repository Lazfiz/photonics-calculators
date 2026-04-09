import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/imaging/speckle-imaging' },
    title: 'Speckle Imaging',
  description: 'Speckle size, contrast, averaging strategies, and surface roughness effects.'
};
const jsonLd = generateCalculatorJsonLd(
  `Speckle Imaging',
  description: 'Speckle size, contrast, averaging strategies, and surface roughness effects.'
};


const jsonLd = generateCalculatorJsonLd(
  'Speckle Imaging',
  'Speckle size, contrast, averaging strategies, and surface roughness effects.',
  'https://photonics-calculators.vercel.app/imaging/speckle-imaging',
  { category: 'Imaging`,
  `Speckle size, contrast, averaging strategies, and surface roughness effects.'
};


const jsonLd = generateCalculatorJsonLd(
  'Speckle Imaging',
  'Speckle size, contrast, averaging strategies, and surface roughness effects.',
  'https://photonics-calculators.vercel.app/imaging/speckle-imaging',
  { category: 'Imaging`,
  `https://photonics-calculators.vercel.app/imaging/speckle-imaging`,
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
