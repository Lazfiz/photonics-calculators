import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/fiber-optics/bend-insensitive' },
    title: 'Bend-Insensitive Fiber Calculator',
    description: 'Design and analyze bend-insensitive fibers with depressed cladding trenches (ITU-T G.657).'
};

const jsonLd = generateCalculatorJsonLd(
  'Bend-Insensitive Fiber Calculator',
  'Design and analyze bend-insensitive fibers with depressed cladding trenches (ITU-T G.657).',
  'https://photonics-calculators.vercel.app/fiber-optics/bend-insensitive',
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
