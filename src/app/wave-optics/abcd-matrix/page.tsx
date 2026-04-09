import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/wave-optics/abcd-matrix' },
    title: 'ABCD Matrix Calculator',
  description: 'Build an optical system from sequential elements and compute the ray transfer matrix.'
};
const jsonLd = generateCalculatorJsonLd(
  `ABCD Matrix Calculator',
  description: 'Build an optical system from sequential elements and compute the ray transfer matrix.'
};


const jsonLd = generateCalculatorJsonLd(
  'ABCD Matrix Calculator',
  'Build an optical system from sequential elements and compute the ray transfer matrix.',
  'https://photonics-calculators.vercel.app/wave-optics/abcd-matrix',
  { category: 'Wave Optics`,
  `Build an optical system from sequential elements and compute the ray transfer matrix.'
};


const jsonLd = generateCalculatorJsonLd(
  'ABCD Matrix Calculator',
  'Build an optical system from sequential elements and compute the ray transfer matrix.',
  'https://photonics-calculators.vercel.app/wave-optics/abcd-matrix',
  { category: 'Wave Optics`,
  `https://photonics-calculators.vercel.app/wave-optics/abcd-matrix`,
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
