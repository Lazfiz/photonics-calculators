import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/materials/gvd' },
      title: 'Group Velocity Dispersion (GVD)',
  description: 'Calculate d²n/d² and dispersion parameter from Sellmeier coefficients.',
};
const jsonLd = generateCalculatorJsonLd(
  `Group Velocity Dispersion (GVD)',
  description: 'Calculate d²n/d² and dispersion parameter from Sellmeier coefficients.',
};


const jsonLd = generateCalculatorJsonLd(
  'Group Velocity Dispersion (GVD)',
  'Calculate d²n/d² and dispersion parameter from Sellmeier coefficients.',
  'https://photonics-calculators.vercel.app/materials/gvd',
  { category: 'Materials`,
  `Calculate d²n/d² and dispersion parameter from Sellmeier coefficients.',
};


const jsonLd = generateCalculatorJsonLd(
  'Group Velocity Dispersion (GVD)',
  'Calculate d²n/d² and dispersion parameter from Sellmeier coefficients.',
  'https://photonics-calculators.vercel.app/materials/gvd',
  { category: 'Materials`,
  `https://photonics-calculators.vercel.app/materials/gvd`,
  { category: `Materials` }
);
export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}
