import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/fiber-optics/fiber-delay-line' },
    title: 'Fiber Delay Line Calculator',
    description: 'Calculate propagation delay, pulse broadening, phase shift, and FSR for fiber optic delay lines.'
};

const jsonLd = generateCalculatorJsonLd(
  'Fiber Delay Line Calculator',
  'Calculate propagation delay, pulse broadening, phase shift, and FSR for fiber optic delay lines.',
  'https://photonics-calculators.vercel.app/fiber-optics/fiber-delay-line',
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
