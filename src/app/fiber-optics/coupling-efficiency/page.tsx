import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/fiber-optics/coupling-efficiency' },
    title: 'Fiber Coupling Efficiency',
  description: 'Estimate Gaussian-to-fiber coupling loss from NA mismatch, lateral offset, and angular misalignment.'
};
const jsonLd = generateCalculatorJsonLd(
  `Fiber Coupling Efficiency',
  description: 'Estimate Gaussian-to-fiber coupling loss from NA mismatch, lateral offset, and angular misalignment.'
};


const jsonLd = generateCalculatorJsonLd(
  'Fiber Coupling Efficiency',
  'Estimate Gaussian-to-fiber coupling loss from NA mismatch, lateral offset, and angular misalignment.',
  'https://photonics-calculators.vercel.app/fiber-optics/coupling-efficiency',
  { category: 'Fiber Optics`,
  `Estimate Gaussian-to-fiber coupling loss from NA mismatch, lateral offset, and angular misalignment.'
};


const jsonLd = generateCalculatorJsonLd(
  'Fiber Coupling Efficiency',
  'Estimate Gaussian-to-fiber coupling loss from NA mismatch, lateral offset, and angular misalignment.',
  'https://photonics-calculators.vercel.app/fiber-optics/coupling-efficiency',
  { category: 'Fiber Optics`,
  `https://photonics-calculators.vercel.app/fiber-optics/coupling-efficiency`,
  { category: `Fiber Optics` }
);
export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}
