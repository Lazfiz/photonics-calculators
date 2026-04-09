import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/fiber-optics/photonic-crystal' },
    title: 'Photonic Crystal',
  description: 'Interactive Photonic Crystal calculator for photonics and optical engineering.'
};
const jsonLd = generateCalculatorJsonLd(
  `Photonic Crystal',
  description: 'Interactive Photonic Crystal calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Photonic Crystal',
  'Interactive Photonic Crystal calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/fiber-optics/photonic-crystal',
  { category: 'Fiber Optics`,
  `Interactive Photonic Crystal calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'Photonic Crystal',
  'Interactive Photonic Crystal calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/fiber-optics/photonic-crystal',
  { category: 'Fiber Optics`,
  `https://photonics-calculators.vercel.app/fiber-optics/photonic-crystal`,
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
