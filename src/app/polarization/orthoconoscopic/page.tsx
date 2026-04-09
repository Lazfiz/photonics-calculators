import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/polarization/orthoconoscopic' },
    title: 'Orthoscopic Observation',
  description: 'Model orthoscopic observation of birefringent samples with rotating stage. Calculate intensity vs rotation angle and interference colors.'
};
const jsonLd = generateCalculatorJsonLd(
  `Orthoscopic Observation',
  description: 'Model orthoscopic observation of birefringent samples with rotating stage. Calculate intensity vs rotation angle and interference colors.'
};


const jsonLd = generateCalculatorJsonLd(
  'Orthoscopic Observation',
  'Model orthoscopic observation of birefringent samples with rotating stage. Calculate intensity vs rotation angle and interference colors.',
  'https://photonics-calculators.vercel.app/polarization/orthoconoscopic',
  { category: 'Polarization`,
  `Model orthoscopic observation of birefringent samples with rotating stage. Calculate intensity vs rotation angle and interference colors.'
};


const jsonLd = generateCalculatorJsonLd(
  'Orthoscopic Observation',
  'Model orthoscopic observation of birefringent samples with rotating stage. Calculate intensity vs rotation angle and interference colors.',
  'https://photonics-calculators.vercel.app/polarization/orthoconoscopic',
  { category: 'Polarization`,
  `https://photonics-calculators.vercel.app/polarization/orthoconoscopic`,
  { category: `Polarization` }
);
export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}
