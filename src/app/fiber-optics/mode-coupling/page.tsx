import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/fiber-optics/mode-coupling' },
    title: 'Mode Coupling',
  description: 'Interactive Mode Coupling calculator for photonics and optical engineering.'
};
const jsonLd = generateCalculatorJsonLd(
  `Mode Coupling',
  description: 'Interactive Mode Coupling calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Mode Coupling',
  'Interactive Mode Coupling calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/fiber-optics/mode-coupling',
  { category: 'Fiber Optics`,
  `Interactive Mode Coupling calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Mode Coupling',
  'Interactive Mode Coupling calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/fiber-optics/mode-coupling',
  { category: 'Fiber Optics`,
  `https://photonics-calculators.vercel.app/fiber-optics/mode-coupling`,
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
