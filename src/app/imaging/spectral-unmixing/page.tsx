import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/imaging/spectral-unmixing' },
    title: 'Spectral Unmixing',
  description: 'Decompose mixed spectral signals into constituent endmember abundances using linear unmixing methods.'
};
const jsonLd = generateCalculatorJsonLd(
  `Spectral Unmixing',
  description: 'Decompose mixed spectral signals into constituent endmember abundances using linear unmixing methods.'
};


const jsonLd = generateCalculatorJsonLd(
  'Spectral Unmixing',
  'Decompose mixed spectral signals into constituent endmember abundances using linear unmixing methods.',
  'https://photonics-calculators.vercel.app/imaging/spectral-unmixing',
  { category: 'Imaging`,
  `Decompose mixed spectral signals into constituent endmember abundances using linear unmixing methods.'
};


const jsonLd = generateCalculatorJsonLd(
  'Spectral Unmixing',
  'Decompose mixed spectral signals into constituent endmember abundances using linear unmixing methods.',
  'https://photonics-calculators.vercel.app/imaging/spectral-unmixing',
  { category: 'Imaging`,
  `https://photonics-calculators.vercel.app/imaging/spectral-unmixing`,
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
