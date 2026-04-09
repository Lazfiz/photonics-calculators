import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/laser-safety/green-laser-pointer' },
    title: 'Green Laser Pointer Safety',
  description: 'Safety analysis for 532 nm DPSS green laser pointers — NOHD, flashblindness, retinal hazard, and classification.'
};
const jsonLd = generateCalculatorJsonLd(
  `Green Laser Pointer Safety',
  description: 'Safety analysis for 532 nm DPSS green laser pointers — NOHD, flashblindness, retinal hazard, and classification.'
};


const jsonLd = generateCalculatorJsonLd(
  'Green Laser Pointer Safety',
  'Safety analysis for 532 nm DPSS green laser pointers — NOHD, flashblindness, retinal hazard, and classification.',
  'https://photonics-calculators.vercel.app/laser-safety/green-laser-pointer',
  { category: 'Laser Safety`,
  `Safety analysis for 532 nm DPSS green laser pointers — NOHD, flashblindness, retinal hazard, and classification.'
};


const jsonLd = generateCalculatorJsonLd(
  'Green Laser Pointer Safety',
  'Safety analysis for 532 nm DPSS green laser pointers — NOHD, flashblindness, retinal hazard, and classification.',
  'https://photonics-calculators.vercel.app/laser-safety/green-laser-pointer',
  { category: 'Laser Safety`,
  `https://photonics-calculators.vercel.app/laser-safety/green-laser-pointer`,
  { category: `Laser Safety` }
);
export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}
