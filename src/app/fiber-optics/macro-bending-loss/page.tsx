import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/fiber-optics/macro-bending-loss' },
    title: 'Macrobending Loss',
  description: 'Detailed macrobending loss calculation using the curvature radiation model for single-mode fiber.'
};
const jsonLd = generateCalculatorJsonLd(
  `Macrobending Loss',
  description: 'Detailed macrobending loss calculation using the curvature radiation model for single-mode fiber.'
};


const jsonLd = generateCalculatorJsonLd(
  'Macrobending Loss',
  'Detailed macrobending loss calculation using the curvature radiation model for single-mode fiber.',
  'https://photonics-calculators.vercel.app/fiber-optics/macro-bending-loss',
  { category: 'Fiber Optics`,
  `Detailed macrobending loss calculation using the curvature radiation model for single-mode fiber.'
};


const jsonLd = generateCalculatorJsonLd(
  'Macrobending Loss',
  'Detailed macrobending loss calculation using the curvature radiation model for single-mode fiber.',
  'https://photonics-calculators.vercel.app/fiber-optics/macro-bending-loss',
  { category: 'Fiber Optics`,
  `https://photonics-calculators.vercel.app/fiber-optics/macro-bending-loss`,
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
