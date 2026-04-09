import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/fiber-optics/polarization-maintaining' },
    title: 'Polarization Maintaining',
  description: 'Interactive Polarization Maintaining calculator for photonics and optical engineering.'
};
const jsonLd = generateCalculatorJsonLd(
  `Polarization Maintaining',
  description: 'Interactive Polarization Maintaining calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Polarization Maintaining',
  'Interactive Polarization Maintaining calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/fiber-optics/polarization-maintaining',
  { category: 'Fiber Optics`,
  `Interactive Polarization Maintaining calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Polarization Maintaining',
  'Interactive Polarization Maintaining calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/fiber-optics/polarization-maintaining',
  { category: 'Fiber Optics`,
  `https://photonics-calculators.vercel.app/fiber-optics/polarization-maintaining`,
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
