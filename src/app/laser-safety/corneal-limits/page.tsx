import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/laser-safety/corneal-limits' },
    title: 'Corneal Exposure Limits',
  description: 'Corneal MPE across UV, visible, and IR spectral regions. Simplified model.'
};
const jsonLd = generateCalculatorJsonLd(
  `Corneal Exposure Limits',
  description: 'Corneal MPE across UV, visible, and IR spectral regions. Simplified model.'
};


const jsonLd = generateCalculatorJsonLd(
  'Corneal Exposure Limits',
  'Corneal MPE across UV, visible, and IR spectral regions. Simplified model.',
  'https://photonics-calculators.vercel.app/laser-safety/corneal-limits',
  { category: 'Laser Safety`,
  `Corneal MPE across UV, visible, and IR spectral regions. Simplified model.'
};


const jsonLd = generateCalculatorJsonLd(
  'Corneal Exposure Limits',
  'Corneal MPE across UV, visible, and IR spectral regions. Simplified model.',
  'https://photonics-calculators.vercel.app/laser-safety/corneal-limits',
  { category: 'Laser Safety`,
  `https://photonics-calculators.vercel.app/laser-safety/corneal-limits`,
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
