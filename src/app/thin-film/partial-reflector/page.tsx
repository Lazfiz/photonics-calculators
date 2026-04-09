import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/thin-film/partial-reflector' },
      title: 'Partial Reflector Design',
  description: 'Partial reflectors (output couplers, etalon mirrors) provide controlled reflectance between',
};
const jsonLd = generateCalculatorJsonLd(
  `Partial Reflector Design',
  description: 'Partial reflectors (output couplers, etalon mirrors) provide controlled reflectance between',
};


const jsonLd = generateCalculatorJsonLd(
  'Partial Reflector Design',
  'Partial reflectors (output couplers, etalon mirrors) provide controlled reflectance between',
  'https://photonics-calculators.vercel.app/thin-film/partial-reflector',
  { category: 'Thin Film`,
  `Partial reflectors (output couplers, etalon mirrors) provide controlled reflectance between',
};


const jsonLd = generateCalculatorJsonLd(
  'Partial Reflector Design',
  'Partial reflectors (output couplers, etalon mirrors) provide controlled reflectance between',
  'https://photonics-calculators.vercel.app/thin-film/partial-reflector',
  { category: 'Thin Film`,
  `https://photonics-calculators.vercel.app/thin-film/partial-reflector`,
  { category: `Thin Film` }
);
export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}
