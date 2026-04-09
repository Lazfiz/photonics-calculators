import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/fiber-optics/pump-combiner' },
    title: 'Pump Combiner',
  description: 'Interactive Pump Combiner calculator for photonics and optical engineering.'
};
const jsonLd = generateCalculatorJsonLd(
  `Pump Combiner',
  description: 'Interactive Pump Combiner calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Pump Combiner',
  'Interactive Pump Combiner calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/fiber-optics/pump-combiner',
  { category: 'Fiber Optics`,
  `Interactive Pump Combiner calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Pump Combiner',
  'Interactive Pump Combiner calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/fiber-optics/pump-combiner',
  { category: 'Fiber Optics`,
  `https://photonics-calculators.vercel.app/fiber-optics/pump-combiner`,
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
