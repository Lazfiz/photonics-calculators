import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/fiber-optics/multi-core' },
    title: 'Multi-Core Fiber Crosstalk',
  description: 'Simplified coupled-mode estimate of inter-core coupling, crosstalk and packing density in a homogeneous multi-core fiber versus core pitch and length.'
};

const jsonLd = generateCalculatorJsonLd(
  'Multi-Core Fiber Crosstalk',
  'Simplified coupled-mode estimate of inter-core coupling, crosstalk and packing density in a homogeneous multi-core fiber versus core pitch and length.',
  'https://photonics-calculators.vercel.app/fiber-optics/multi-core',
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
