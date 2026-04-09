import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/fiber-optics/fiber-coupler' },
    title: 'Fiber Coupler',
  description: 'Interactive Fiber Coupler calculator for photonics and optical engineering.'
};
const jsonLd = generateCalculatorJsonLd(
  `Fiber Coupler',
  description: 'Interactive Fiber Coupler calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Fiber Coupler',
  'Interactive Fiber Coupler calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/fiber-optics/fiber-coupler',
  { category: 'Fiber Optics`,
  `Interactive Fiber Coupler calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Fiber Coupler',
  'Interactive Fiber Coupler calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/fiber-optics/fiber-coupler',
  { category: 'Fiber Optics`,
  `https://photonics-calculators.vercel.app/fiber-optics/fiber-coupler`,
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
