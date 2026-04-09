import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/laser-safety/extended-source' },
    title: 'Extended Source Correction (C₆)',
  description: 'C₆ angular subtense correction factor for extended source laser hazard evaluation per ANSI Z136.'
};
const jsonLd = generateCalculatorJsonLd(
  `Extended Source Correction (C₆)',
  description: 'C₆ angular subtense correction factor for extended source laser hazard evaluation per ANSI Z136.'
};


const jsonLd = generateCalculatorJsonLd(
  'Extended Source Correction (C₆)',
  'C₆ angular subtense correction factor for extended source laser hazard evaluation per ANSI Z136.',
  'https://photonics-calculators.vercel.app/laser-safety/extended-source',
  { category: 'Laser Safety`,
  `C₆ angular subtense correction factor for extended source laser hazard evaluation per ANSI Z136.'
};


const jsonLd = generateCalculatorJsonLd(
  'Extended Source Correction (C₆)',
  'C₆ angular subtense correction factor for extended source laser hazard evaluation per ANSI Z136.',
  'https://photonics-calculators.vercel.app/laser-safety/extended-source',
  { category: 'Laser Safety`,
  `https://photonics-calculators.vercel.app/laser-safety/extended-source`,
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
