import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/imaging/frap' },
    title: 'FRAP Diffusion Coefficient Calculator',
  description: 'Calculate diffusion coefficients from Fluorescence Recovery After Photobleaching data.'
};
const jsonLd = generateCalculatorJsonLd(
  `FRAP Diffusion Coefficient Calculator',
  description: 'Calculate diffusion coefficients from Fluorescence Recovery After Photobleaching data.'
};


const jsonLd = generateCalculatorJsonLd(
  'FRAP Diffusion Coefficient Calculator',
  'Calculate diffusion coefficients from Fluorescence Recovery After Photobleaching data.',
  'https://photonics-calculators.vercel.app/imaging/frap',
  { category: 'Imaging`,
  `Calculate diffusion coefficients from Fluorescence Recovery After Photobleaching data.'
};


const jsonLd = generateCalculatorJsonLd(
  'FRAP Diffusion Coefficient Calculator',
  'Calculate diffusion coefficients from Fluorescence Recovery After Photobleaching data.',
  'https://photonics-calculators.vercel.app/imaging/frap',
  { category: 'Imaging`,
  `https://photonics-calculators.vercel.app/imaging/frap`,
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
