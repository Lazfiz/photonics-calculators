import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/fiber-optics/fiber-laser' },
    title: 'Fiber Laser',
  description: 'Interactive Fiber Laser calculator for photonics and optical engineering.'
};
const jsonLd = generateCalculatorJsonLd(
  `Fiber Laser',
  description: 'Interactive Fiber Laser calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Fiber Laser',
  'Interactive Fiber Laser calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/fiber-optics/fiber-laser',
  { category: 'Fiber Optics`,
  `Interactive Fiber Laser calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Fiber Laser',
  'Interactive Fiber Laser calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/fiber-optics/fiber-laser',
  { category: 'Fiber Optics`,
  `https://photonics-calculators.vercel.app/fiber-optics/fiber-laser`,
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
