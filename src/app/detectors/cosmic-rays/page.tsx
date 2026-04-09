import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/detectors/cosmic-rays' },
    title: 'Cosmic Ray Detection',
  description: 'Cosmic ray flux and impact on imaging sensors — estimate hit rates and affected pixels.'
};
const jsonLd = generateCalculatorJsonLd(
  `Cosmic Ray Detection',
  description: 'Cosmic ray flux and impact on imaging sensors — estimate hit rates and affected pixels.'
};


const jsonLd = generateCalculatorJsonLd(
  'Cosmic Ray Detection',
  'Cosmic ray flux and impact on imaging sensors — estimate hit rates and affected pixels.',
  'https://photonics-calculators.vercel.app/detectors/cosmic-rays',
  { category: 'Detectors`,
  `Cosmic ray flux and impact on imaging sensors — estimate hit rates and affected pixels.'
};


const jsonLd = generateCalculatorJsonLd(
  'Cosmic Ray Detection',
  'Cosmic ray flux and impact on imaging sensors — estimate hit rates and affected pixels.',
  'https://photonics-calculators.vercel.app/detectors/cosmic-rays',
  { category: 'Detectors`,
  `https://photonics-calculators.vercel.app/detectors/cosmic-rays`,
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
