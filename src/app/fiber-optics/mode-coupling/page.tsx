import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
  alternates: { canonical: 'https://photonics-calculators.vercel.app/fiber-optics/mode-coupling' },
  title: 'Coupled-Mode Power Transfer',
  description: 'Coupled-mode power transfer between two waveguides: coupled and through power, coupling efficiency and full-transfer length from κ and Δβ.'
};

const jsonLd = generateCalculatorJsonLd(
  'Coupled-Mode Power Transfer',
  'Coupled-mode power transfer between two waveguides: coupled and through power, coupling efficiency and full-transfer length from κ and Δβ.',
  'https://photonics-calculators.vercel.app/fiber-optics/mode-coupling',
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
