import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/polarization/stokes' },
    title: 'Stokes Parameters',
  description: 'Analyze polarization state from Stokes vector components with Poincaré-sphere visualization.'
};
const jsonLd = generateCalculatorJsonLd(
  `Stokes Parameters',
  description: 'Analyze polarization state from Stokes vector components with Poincaré-sphere visualization.'
};


const jsonLd = generateCalculatorJsonLd(
  'Stokes Parameters',
  'Analyze polarization state from Stokes vector components with Poincaré-sphere visualization.',
  'https://photonics-calculators.vercel.app/polarization/stokes',
  { category: 'Polarization`,
  `Analyze polarization state from Stokes vector components with Poincaré-sphere visualization.'
};


const jsonLd = generateCalculatorJsonLd(
  'Stokes Parameters',
  'Analyze polarization state from Stokes vector components with Poincaré-sphere visualization.',
  'https://photonics-calculators.vercel.app/polarization/stokes',
  { category: 'Polarization`,
  `https://photonics-calculators.vercel.app/polarization/stokes`,
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
