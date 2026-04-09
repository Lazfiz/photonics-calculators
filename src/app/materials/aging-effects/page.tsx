import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/materials/aging-effects' },
    title: 'Aging of Optical Materials',
  description: 'Long-term degradation: transmission loss, solarization, compaction, stress relaxation',
};
const jsonLd = generateCalculatorJsonLd(
  `Aging of Optical Materials',
  description: 'Long-term degradation: transmission loss, solarization, compaction, stress relaxation',
};


const jsonLd = generateCalculatorJsonLd(
  'Aging of Optical Materials',
  'Long-term degradation: transmission loss, solarization, compaction, stress relaxation',
  'https://photonics-calculators.vercel.app/materials/aging-effects',
  { category: 'Materials`,
  `Long-term degradation: transmission loss, solarization, compaction, stress relaxation',
};


const jsonLd = generateCalculatorJsonLd(
  'Aging of Optical Materials',
  'Long-term degradation: transmission loss, solarization, compaction, stress relaxation',
  'https://photonics-calculators.vercel.app/materials/aging-effects',
  { category: 'Materials`,
  `https://photonics-calculators.vercel.app/materials/aging-effects`,
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
