import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/polarization/jones-chain' },
    title: 'Jones Matrix Chain',
  description: 'Chain Jones matrices to transform input polarization states and visualize the output ellipse.'
};
const jsonLd = generateCalculatorJsonLd(
  `Jones Matrix Chain',
  description: 'Chain Jones matrices to transform input polarization states and visualize the output ellipse.'
};


const jsonLd = generateCalculatorJsonLd(
  'Jones Matrix Chain',
  'Chain Jones matrices to transform input polarization states and visualize the output ellipse.',
  'https://photonics-calculators.vercel.app/polarization/jones-chain',
  { category: 'Polarization`,
  `Chain Jones matrices to transform input polarization states and visualize the output ellipse.'
};


const jsonLd = generateCalculatorJsonLd(
  'Jones Matrix Chain',
  'Chain Jones matrices to transform input polarization states and visualize the output ellipse.',
  'https://photonics-calculators.vercel.app/polarization/jones-chain',
  { category: 'Polarization`,
  `https://photonics-calculators.vercel.app/polarization/jones-chain`,
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
