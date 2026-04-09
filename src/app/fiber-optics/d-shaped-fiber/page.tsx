import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/fiber-optics/d-shaped-fiber' },
    title: 'D-Shaped Fiber',
  description: 'Birefringence, evanescent field, and polarization properties of D-shaped (flat) fibers.'
};
const jsonLd = generateCalculatorJsonLd(
  `D-Shaped Fiber',
  description: 'Birefringence, evanescent field, and polarization properties of D-shaped (flat) fibers.'
};


const jsonLd = generateCalculatorJsonLd(
  'D-Shaped Fiber',
  'Birefringence, evanescent field, and polarization properties of D-shaped (flat) fibers.',
  'https://photonics-calculators.vercel.app/fiber-optics/d-shaped-fiber',
  { category: 'Fiber Optics`,
  `Birefringence, evanescent field, and polarization properties of D-shaped (flat) fibers.'
};


const jsonLd = generateCalculatorJsonLd(
  'D-Shaped Fiber',
  'Birefringence, evanescent field, and polarization properties of D-shaped (flat) fibers.',
  'https://photonics-calculators.vercel.app/fiber-optics/d-shaped-fiber',
  { category: 'Fiber Optics`,
  `https://photonics-calculators.vercel.app/fiber-optics/d-shaped-fiber`,
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
