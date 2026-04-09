import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/fiber-optics/fiber-amplifier' },
    title: 'Fiber Amplifier',
  description: 'Interactive Fiber Amplifier calculator for photonics and optical engineering.'
};
const jsonLd = generateCalculatorJsonLd(
  `Fiber Amplifier',
  description: 'Interactive Fiber Amplifier calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Fiber Amplifier',
  'Interactive Fiber Amplifier calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/fiber-optics/fiber-amplifier',
  { category: 'Fiber Optics`,
  `Interactive Fiber Amplifier calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Fiber Amplifier',
  'Interactive Fiber Amplifier calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/fiber-optics/fiber-amplifier',
  { category: 'Fiber Optics`,
  `https://photonics-calculators.vercel.app/fiber-optics/fiber-amplifier`,
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
