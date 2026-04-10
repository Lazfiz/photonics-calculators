import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/fiber-optics/bend-loss' },
    title: 'Macro Bending Loss Calculator',
    description: 'Estimate macro-bending loss for single-mode fiber using simplified Marcuse formula.'
};

const jsonLd = generateCalculatorJsonLd(
  'Macro Bending Loss Calculator',
  'Estimate macro-bending loss for single-mode fiber using simplified Marcuse formula.',
  'https://photonics-calculators.vercel.app/fiber-optics/bend-loss',
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
