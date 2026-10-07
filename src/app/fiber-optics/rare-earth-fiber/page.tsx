import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/fiber-optics/rare-earth-fiber' },
    title: 'Rare-Earth Fiber Dopants',
  description: 'Pump bands, cross-sections, lifetime, absorption, small-signal gain and optimal length of Er, Yb, Tm and Ho-doped fibers from concentration and core size.'
};

const jsonLd = generateCalculatorJsonLd(
  'Rare-Earth Fiber Dopants',
  'Pump bands, cross-sections, lifetime, absorption, small-signal gain and optimal length of Er, Yb, Tm and Ho-doped fibers from concentration and core size.',
  'https://photonics-calculators.vercel.app/fiber-optics/rare-earth-fiber',
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
