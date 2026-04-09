import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/detectors/back-illumination' },
    title: 'Back-Illuminated vs Front-Illuminated',
  description: 'Back-illuminated sensors bypass gate structures for higher QE and better blue/UV response.'
};
const jsonLd = generateCalculatorJsonLd(
  `Back-Illuminated vs Front-Illuminated',
  description: 'Back-illuminated sensors bypass gate structures for higher QE and better blue/UV response.'
};


const jsonLd = generateCalculatorJsonLd(
  'Back-Illuminated vs Front-Illuminated',
  'Back-illuminated sensors bypass gate structures for higher QE and better blue/UV response.',
  'https://photonics-calculators.vercel.app/detectors/back-illumination',
  { category: 'Detectors`,
  `Back-illuminated sensors bypass gate structures for higher QE and better blue/UV response.'
};


const jsonLd = generateCalculatorJsonLd(
  'Back-Illuminated vs Front-Illuminated',
  'Back-illuminated sensors bypass gate structures for higher QE and better blue/UV response.',
  'https://photonics-calculators.vercel.app/detectors/back-illumination',
  { category: 'Detectors`,
  `https://photonics-calculators.vercel.app/detectors/back-illumination`,
  { category: `Detectors` }
);
export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}
