import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/detectors/spad-dead-time' },
    title: 'SPAD Dead Time',
  description: 'Dead time effects on measured count rates, pile-up loss, and correction for SPAD detectors.'
};
const jsonLd = generateCalculatorJsonLd(
  `SPAD Dead Time',
  description: 'Dead time effects on measured count rates, pile-up loss, and correction for SPAD detectors.'
};


const jsonLd = generateCalculatorJsonLd(
  'SPAD Dead Time',
  'Dead time effects on measured count rates, pile-up loss, and correction for SPAD detectors.',
  'https://photonics-calculators.vercel.app/detectors/spad-dead-time',
  { category: 'Detectors`,
  `Dead time effects on measured count rates, pile-up loss, and correction for SPAD detectors.'
};


const jsonLd = generateCalculatorJsonLd(
  'SPAD Dead Time',
  'Dead time effects on measured count rates, pile-up loss, and correction for SPAD detectors.',
  'https://photonics-calculators.vercel.app/detectors/spad-dead-time',
  { category: 'Detectors`,
  `https://photonics-calculators.vercel.app/detectors/spad-dead-time`,
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
