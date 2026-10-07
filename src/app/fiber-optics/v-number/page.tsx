import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/fiber-optics/v-number' },
    title: 'Fiber V-Number',
  description: 'Normalized frequency V = 2πa·NA/λ of a step-index fiber, NA from core and cladding indices, the single-mode check (V < 2.405) and the mode count.'
};

const jsonLd = generateCalculatorJsonLd(
  'Fiber V-Number',
  'Normalized frequency V = 2πa·NA/λ of a step-index fiber, NA from core and cladding indices, the single-mode check (V < 2.405) and the mode count.',
  'https://photonics-calculators.vercel.app/fiber-optics/v-number',
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
