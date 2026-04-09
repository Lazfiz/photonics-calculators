import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/fiber-optics/fiber-bandwidth' },
    title: 'Fiber Bandwidth Calculation',
  description: 'Calculate bandwidth limitations from chromatic dispersion, modal dispersion (MMF), and PMD for various fiber types and link configurations.'
};
const jsonLd = generateCalculatorJsonLd(
  `Fiber Bandwidth Calculation',
  description: 'Calculate bandwidth limitations from chromatic dispersion, modal dispersion (MMF), and PMD for various fiber types and link configurations.'
};


const jsonLd = generateCalculatorJsonLd(
  'Fiber Bandwidth Calculation',
  'Calculate bandwidth limitations from chromatic dispersion, modal dispersion (MMF), and PMD for various fiber types and link configurations.',
  'https://photonics-calculators.vercel.app/fiber-optics/fiber-bandwidth',
  { category: 'Fiber Optics`,
  `Calculate bandwidth limitations from chromatic dispersion, modal dispersion (MMF), and PMD for various fiber types and link configurations.'
};


const jsonLd = generateCalculatorJsonLd(
  'Fiber Bandwidth Calculation',
  'Calculate bandwidth limitations from chromatic dispersion, modal dispersion (MMF), and PMD for various fiber types and link configurations.',
  'https://photonics-calculators.vercel.app/fiber-optics/fiber-bandwidth',
  { category: 'Fiber Optics`,
  `https://photonics-calculators.vercel.app/fiber-optics/fiber-bandwidth`,
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
