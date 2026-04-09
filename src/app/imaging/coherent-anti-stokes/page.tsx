import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/imaging/coherent-anti-stokes' },
    title: 'CARS Imaging Calculator',
  description: 'Coherent Anti-Stokes Raman Scattering: vibrational shift, CARS wavelength, and laser parameters.'
};
const jsonLd = generateCalculatorJsonLd(
  `CARS Imaging Calculator',
  description: 'Coherent Anti-Stokes Raman Scattering: vibrational shift, CARS wavelength, and laser parameters.'
};


const jsonLd = generateCalculatorJsonLd(
  'CARS Imaging Calculator',
  'Coherent Anti-Stokes Raman Scattering: vibrational shift, CARS wavelength, and laser parameters.',
  'https://photonics-calculators.vercel.app/imaging/coherent-anti-stokes',
  { category: 'Imaging`,
  `Coherent Anti-Stokes Raman Scattering: vibrational shift, CARS wavelength, and laser parameters.'
};


const jsonLd = generateCalculatorJsonLd(
  'CARS Imaging Calculator',
  'Coherent Anti-Stokes Raman Scattering: vibrational shift, CARS wavelength, and laser parameters.',
  'https://photonics-calculators.vercel.app/imaging/coherent-anti-stokes',
  { category: 'Imaging`,
  `https://photonics-calculators.vercel.app/imaging/coherent-anti-stokes`,
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
