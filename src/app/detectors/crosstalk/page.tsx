import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/detectors/crosstalk' },
    title: 'Pixel Crosstalk',
  description: 'Optical and electrical crosstalk between adjacent pixels due to charge diffusion.'
};
const jsonLd = generateCalculatorJsonLd(
  `Pixel Crosstalk',
  description: 'Optical and electrical crosstalk between adjacent pixels due to charge diffusion.'
};


const jsonLd = generateCalculatorJsonLd(
  'Pixel Crosstalk',
  'Optical and electrical crosstalk between adjacent pixels due to charge diffusion.',
  'https://photonics-calculators.vercel.app/detectors/crosstalk',
  { category: 'Detectors`,
  `Optical and electrical crosstalk between adjacent pixels due to charge diffusion.'
};


const jsonLd = generateCalculatorJsonLd(
  'Pixel Crosstalk',
  'Optical and electrical crosstalk between adjacent pixels due to charge diffusion.',
  'https://photonics-calculators.vercel.app/detectors/crosstalk',
  { category: 'Detectors`,
  `https://photonics-calculators.vercel.app/detectors/crosstalk`,
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
