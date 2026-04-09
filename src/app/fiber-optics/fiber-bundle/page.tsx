import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/fiber-optics/fiber-bundle' },
    title: 'Fiber Bundle Design',
  description: 'Calculate bundle geometry, fill factor, étendue, and coupling efficiency for fiber optic bundles.'
};
const jsonLd = generateCalculatorJsonLd(
  `Fiber Bundle Design',
  description: 'Calculate bundle geometry, fill factor, étendue, and coupling efficiency for fiber optic bundles.'
};


const jsonLd = generateCalculatorJsonLd(
  'Fiber Bundle Design',
  'Calculate bundle geometry, fill factor, étendue, and coupling efficiency for fiber optic bundles.',
  'https://photonics-calculators.vercel.app/fiber-optics/fiber-bundle',
  { category: 'Fiber Optics`,
  `Calculate bundle geometry, fill factor, étendue, and coupling efficiency for fiber optic bundles.'
};


const jsonLd = generateCalculatorJsonLd(
  'Fiber Bundle Design',
  'Calculate bundle geometry, fill factor, étendue, and coupling efficiency for fiber optic bundles.',
  'https://photonics-calculators.vercel.app/fiber-optics/fiber-bundle',
  { category: 'Fiber Optics`,
  `https://photonics-calculators.vercel.app/fiber-optics/fiber-bundle`,
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
