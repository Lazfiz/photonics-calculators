import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/polarization/optical-activity' },
    title: 'Optical Activity',
  description: 'Calculate optical rotation from specific rotation, concentration, and path length with wavelength/temperature corrections.'
};
const jsonLd = generateCalculatorJsonLd(
  `Optical Activity',
  description: 'Calculate optical rotation from specific rotation, concentration, and path length with wavelength/temperature corrections.'
};


const jsonLd = generateCalculatorJsonLd(
  'Optical Activity',
  'Calculate optical rotation from specific rotation, concentration, and path length with wavelength/temperature corrections.',
  'https://photonics-calculators.vercel.app/polarization/optical-activity',
  { category: 'Polarization`,
  `Calculate optical rotation from specific rotation, concentration, and path length with wavelength/temperature corrections.'
};


const jsonLd = generateCalculatorJsonLd(
  'Optical Activity',
  'Calculate optical rotation from specific rotation, concentration, and path length with wavelength/temperature corrections.',
  'https://photonics-calculators.vercel.app/polarization/optical-activity',
  { category: 'Polarization`,
  `https://photonics-calculators.vercel.app/polarization/optical-activity`,
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
