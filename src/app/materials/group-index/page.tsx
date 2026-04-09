import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/materials/group-index' },
      title: 'Group Index (ng)',
  description: 'ng = n − dn/d — the effective index seen by optical pulses',
};
const jsonLd = generateCalculatorJsonLd(
  `Group Index (ng)',
  description: 'ng = n − dn/d — the effective index seen by optical pulses',
};


const jsonLd = generateCalculatorJsonLd(
  'Group Index (ng)',
  'ng = n − dn/d — the effective index seen by optical pulses',
  'https://photonics-calculators.vercel.app/materials/group-index',
  { category: 'Materials`,
  `ng = n − dn/d — the effective index seen by optical pulses',
};


const jsonLd = generateCalculatorJsonLd(
  'Group Index (ng)',
  'ng = n − dn/d — the effective index seen by optical pulses',
  'https://photonics-calculators.vercel.app/materials/group-index',
  { category: 'Materials`,
  `https://photonics-calculators.vercel.app/materials/group-index`,
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
