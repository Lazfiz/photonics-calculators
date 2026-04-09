import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/detectors/uniformity' },
    title: 'Photoresponse Non-Uniformity',
  description: 'PRNU measures the spatial variation in pixel sensitivity across the sensor array. PRNU = PRNU% mean signal.'
};
const jsonLd = generateCalculatorJsonLd(
  `Photoresponse Non-Uniformity',
  description: 'PRNU measures the spatial variation in pixel sensitivity across the sensor array. PRNU = PRNU% mean signal.'
};


const jsonLd = generateCalculatorJsonLd(
  'Photoresponse Non-Uniformity',
  'PRNU measures the spatial variation in pixel sensitivity across the sensor array. PRNU = PRNU% mean signal.',
  'https://photonics-calculators.vercel.app/detectors/uniformity',
  { category: 'Detectors`,
  `PRNU measures the spatial variation in pixel sensitivity across the sensor array. PRNU = PRNU% mean signal.'
};


const jsonLd = generateCalculatorJsonLd(
  'Photoresponse Non-Uniformity',
  'PRNU measures the spatial variation in pixel sensitivity across the sensor array. PRNU = PRNU% mean signal.',
  'https://photonics-calculators.vercel.app/detectors/uniformity',
  { category: 'Detectors`,
  `https://photonics-calculators.vercel.app/detectors/uniformity`,
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
