import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/fiber-optics/chromatic-dispersion' },
    title: 'Chromatic Dispersion (CD)',
  description: 'Calculate chromatic dispersion, pulse broadening, and system penalties for single-mode fiber.'
};
const jsonLd = generateCalculatorJsonLd(
  `Chromatic Dispersion (CD)',
  description: 'Calculate chromatic dispersion, pulse broadening, and system penalties for single-mode fiber.'
};


const jsonLd = generateCalculatorJsonLd(
  'Chromatic Dispersion (CD)',
  'Calculate chromatic dispersion, pulse broadening, and system penalties for single-mode fiber.',
  'https://photonics-calculators.vercel.app/fiber-optics/chromatic-dispersion',
  { category: 'Fiber Optics`,
  `Calculate chromatic dispersion, pulse broadening, and system penalties for single-mode fiber.'
};


const jsonLd = generateCalculatorJsonLd(
  'Chromatic Dispersion (CD)',
  'Calculate chromatic dispersion, pulse broadening, and system penalties for single-mode fiber.',
  'https://photonics-calculators.vercel.app/fiber-optics/chromatic-dispersion',
  { category: 'Fiber Optics`,
  `https://photonics-calculators.vercel.app/fiber-optics/chromatic-dispersion`,
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
