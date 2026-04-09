import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/polarization/mueller-polarimetry' },
    title: 'Mueller Polarimetry',
  description: 'Build optical systems using Mueller matrices and analyze polarization transformations.'
};
const jsonLd = generateCalculatorJsonLd(
  `Mueller Polarimetry',
  description: 'Build optical systems using Mueller matrices and analyze polarization transformations.'
};


const jsonLd = generateCalculatorJsonLd(
  'Mueller Polarimetry',
  'Build optical systems using Mueller matrices and analyze polarization transformations.',
  'https://photonics-calculators.vercel.app/polarization/mueller-polarimetry',
  { category: 'Polarization`,
  `Build optical systems using Mueller matrices and analyze polarization transformations.'
};


const jsonLd = generateCalculatorJsonLd(
  'Mueller Polarimetry',
  'Build optical systems using Mueller matrices and analyze polarization transformations.',
  'https://photonics-calculators.vercel.app/polarization/mueller-polarimetry',
  { category: 'Polarization`,
  `https://photonics-calculators.vercel.app/polarization/mueller-polarimetry`,
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
