import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/laser-safety/uv-exposure' },
    title: 'UV Exposure Limits',
  description: 'Interactive UV Exposure Limits calculator for photonics and optical engineering.'
};
const jsonLd = generateCalculatorJsonLd(
  `UV Exposure Limits',
  description: 'Interactive UV Exposure Limits calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'UV Exposure Limits',
  'Interactive UV Exposure Limits calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/laser-safety/uv-exposure',
  { category: 'Laser Safety`,
  `Interactive UV Exposure Limits calculator for photonics and optical engineering.'
};


const jsonLd = generateCalculatorJsonLd(
  'UV Exposure Limits',
  'Interactive UV Exposure Limits calculator for photonics and optical engineering.',
  'https://photonics-calculators.vercel.app/laser-safety/uv-exposure',
  { category: 'Laser Safety`,
  `https://photonics-calculators.vercel.app/laser-safety/uv-exposure`,
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
