import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/imaging/na-fnumber' },
      title: 'NA f/# Conversion',
  description: 'NA = 1/(2f/#) for objects at infinity. Relates numerical aperture to f-number.',
};
const jsonLd = generateCalculatorJsonLd(
  `NA f/# Conversion',
  description: 'NA = 1/(2f/#) for objects at infinity. Relates numerical aperture to f-number.',
};


const jsonLd = generateCalculatorJsonLd(
  'NA f/# Conversion',
  'NA = 1/(2f/#) for objects at infinity. Relates numerical aperture to f-number.',
  'https://photonics-calculators.vercel.app/imaging/na-fnumber',
  { category: 'Imaging`,
  `NA = 1/(2f/#) for objects at infinity. Relates numerical aperture to f-number.',
};


const jsonLd = generateCalculatorJsonLd(
  'NA f/# Conversion',
  'NA = 1/(2f/#) for objects at infinity. Relates numerical aperture to f-number.',
  'https://photonics-calculators.vercel.app/imaging/na-fnumber',
  { category: 'Imaging`,
  `https://photonics-calculators.vercel.app/imaging/na-fnumber`,
  { category: `Imaging` }
);
export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}
