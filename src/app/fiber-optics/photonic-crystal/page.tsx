import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/fiber-optics/photonic-crystal' },
    title: 'Photonic Crystal Fiber',
  description: 'Approximate NA, V-number, mode area, dispersion and confinement loss of an index-guiding photonic crystal fiber from hole pitch Λ and diameter d.'
};

const jsonLd = generateCalculatorJsonLd(
  'Photonic Crystal Fiber',
  'Approximate NA, V-number, mode area, dispersion and confinement loss of an index-guiding photonic crystal fiber from hole pitch Λ and diameter d.',
  'https://photonics-calculators.vercel.app/fiber-optics/photonic-crystal',
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
