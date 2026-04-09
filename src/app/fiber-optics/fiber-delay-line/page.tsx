import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/fiber-optics/fiber-delay-line' },
    title: 'Fiber Delay Line',
  description: 'Interactive Fiber Delay Line calculator for photonics and optical engineering.'
};
const jsonLd = generateCalculatorJsonLd(
  `Fiber Delay Line',
  description: 'Interactive Fiber Delay Line calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Fiber Delay Line',
  'Interactive Fiber Delay Line calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/fiber-optics/fiber-delay-line',
  { category: 'Fiber Optics`,
  `Interactive Fiber Delay Line calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Fiber Delay Line',
  'Interactive Fiber Delay Line calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/fiber-optics/fiber-delay-line',
  { category: 'Fiber Optics`,
  `https://photonics-calculators.vercel.app/fiber-optics/fiber-delay-line`,
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
