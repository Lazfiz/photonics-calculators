import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/fiber-optics/pump-combiner' },
    title: 'Fiber Pump Combiner',
  description: 'Combined pump power, loss, pump brightness and the NA² brightness-conservation check for an N×1 fiber pump combiner, plus signal insertion loss.'
};

const jsonLd = generateCalculatorJsonLd(
  'Fiber Pump Combiner',
  'Combined pump power, loss, pump brightness and the NA² brightness-conservation check for an N×1 fiber pump combiner, plus signal insertion loss.',
  'https://photonics-calculators.vercel.app/fiber-optics/pump-combiner',
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
