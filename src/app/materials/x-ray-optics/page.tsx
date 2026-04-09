import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/materials/x-ray-optics' },
      title: 'X-ray Optics Materials',
  description: 'X-ray refractive index: n = 1 - - i. For hard X-rays, , ∝ ² ∝ 1/E².',
};
const jsonLd = generateCalculatorJsonLd(
  `X-ray Optics Materials',
  description: 'X-ray refractive index: n = 1 - - i. For hard X-rays, , ∝ ² ∝ 1/E².',
};


const jsonLd = generateCalculatorJsonLd(
  'X-ray Optics Materials',
  'X-ray refractive index: n = 1 - - i. For hard X-rays, , ∝ ² ∝ 1/E².',
  'https://photonics-calculators.vercel.app/materials/x-ray-optics',
  { category: 'Materials`,
  `X-ray refractive index: n = 1 - - i. For hard X-rays, , ∝ ² ∝ 1/E².',
};


const jsonLd = generateCalculatorJsonLd(
  'X-ray Optics Materials',
  'X-ray refractive index: n = 1 - - i. For hard X-rays, , ∝ ² ∝ 1/E².',
  'https://photonics-calculators.vercel.app/materials/x-ray-optics',
  { category: 'Materials`,
  `https://photonics-calculators.vercel.app/materials/x-ray-optics`,
  { category: `Materials` }
);
export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}
