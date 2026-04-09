import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/imaging/tirf' },
    title: 'TIRF Penetration Depth Calculator',
  description: 'Evanescent field penetration depth for Total Internal Reflection Fluorescence microscopy.'
};
const jsonLd = generateCalculatorJsonLd(
  `TIRF Penetration Depth Calculator',
  description: 'Evanescent field penetration depth for Total Internal Reflection Fluorescence microscopy.'
};


const jsonLd = generateCalculatorJsonLd(
  'TIRF Penetration Depth Calculator',
  'Evanescent field penetration depth for Total Internal Reflection Fluorescence microscopy.',
  'https://photonics-calculators.vercel.app/imaging/tirf',
  { category: 'Imaging`,
  `Evanescent field penetration depth for Total Internal Reflection Fluorescence microscopy.'
};


const jsonLd = generateCalculatorJsonLd(
  'TIRF Penetration Depth Calculator',
  'Evanescent field penetration depth for Total Internal Reflection Fluorescence microscopy.',
  'https://photonics-calculators.vercel.app/imaging/tirf',
  { category: 'Imaging`,
  `https://photonics-calculators.vercel.app/imaging/tirf`,
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
