import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/imaging/adaptive-optics' },
    title: 'Adaptive Optics Calculator',
  description: 'AO correction performance, Strehl ratio, and deformable mirror requirements.'
};
const jsonLd = generateCalculatorJsonLd(
  `Adaptive Optics Calculator',
  description: 'AO correction performance, Strehl ratio, and deformable mirror requirements.'
};


const jsonLd = generateCalculatorJsonLd(
  'Adaptive Optics Calculator',
  'AO correction performance, Strehl ratio, and deformable mirror requirements.',
  'https://photonics-calculators.vercel.app/imaging/adaptive-optics',
  { category: 'Imaging`,
  `AO correction performance, Strehl ratio, and deformable mirror requirements.'
};


const jsonLd = generateCalculatorJsonLd(
  'Adaptive Optics Calculator',
  'AO correction performance, Strehl ratio, and deformable mirror requirements.',
  'https://photonics-calculators.vercel.app/imaging/adaptive-optics',
  { category: 'Imaging`,
  `https://photonics-calculators.vercel.app/imaging/adaptive-optics`,
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
