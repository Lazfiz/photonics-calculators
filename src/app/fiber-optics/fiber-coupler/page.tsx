import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/fiber-optics/fiber-coupler' },
    title: 'Fiber Coupler Calculator',
    description: 'Calculate power splitting, transfer curves, and spectral response for directional fiber couplers.'
};

const jsonLd = generateCalculatorJsonLd(
  'Fiber Coupler Calculator',
  'Calculate power splitting, transfer curves, and spectral response for directional fiber couplers.',
  'https://photonics-calculators.vercel.app/fiber-optics/fiber-coupler',
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
