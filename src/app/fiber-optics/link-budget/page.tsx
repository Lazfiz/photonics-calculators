import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/fiber-optics/link-budget' },
    title: 'Fiber Link Budget Calculator',
    description: 'Calculate total optical link loss, received power, and link margin for fiber optic systems.'
};

const jsonLd = generateCalculatorJsonLd(
  'Fiber Link Budget Calculator',
  'Calculate total optical link loss, received power, and link margin for fiber optic systems.',
  'https://photonics-calculators.vercel.app/fiber-optics/link-budget',
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
