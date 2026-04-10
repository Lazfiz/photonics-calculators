import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/fiber-optics/birefringence-fiber' },
    title: 'Birefringence Fiber Calculator',
    description: 'Interactive Birefringence Fiber calculator for photonics and optical engineering.'
};

const jsonLd = generateCalculatorJsonLd(
  'Birefringence Fiber Calculator',
  'Interactive Birefringence Fiber calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/fiber-optics/birefringence-fiber',
  { category: 'Fiber Optics' }
);

export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}
