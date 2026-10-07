import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/fiber-optics/polarization-maintaining' },
    title: 'Polarization-Maintaining Fiber',
  description: 'Birefringence, beat length, h-parameter and output extinction ratio of PANDA, bow-tie and elliptical-core PM fibers versus length and input PER.'
};

const jsonLd = generateCalculatorJsonLd(
  'Polarization-Maintaining Fiber',
  'Birefringence, beat length, h-parameter and output extinction ratio of PANDA, bow-tie and elliptical-core PM fibers versus length and input PER.',
  'https://photonics-calculators.vercel.app/fiber-optics/polarization-maintaining',
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
