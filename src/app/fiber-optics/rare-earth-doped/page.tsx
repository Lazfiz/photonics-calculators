import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/fiber-optics/rare-earth-doped' },
    title: 'Rare-Earth-Doped Fiber Amplifier',
  description: 'Ion density, pump absorption, small-signal gain, saturation power and noise figure of an Er, Yb, Tm or Nd-doped fiber from doping and pump power.'
};

const jsonLd = generateCalculatorJsonLd(
  'Rare-Earth-Doped Fiber Amplifier',
  'Ion density, pump absorption, small-signal gain, saturation power and noise figure of an Er, Yb, Tm or Nd-doped fiber from doping and pump power.',
  'https://photonics-calculators.vercel.app/fiber-optics/rare-earth-doped',
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
