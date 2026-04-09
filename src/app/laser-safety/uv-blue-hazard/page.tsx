import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/laser-safety/uv-blue-hazard' },
      title: 'UV / Blue Light Hazard',
  description: 'Calculates weighted hazard using the blue light B() and UV S() action spectra per IEC 62471 / ICNIRP guidelines.',
};
const jsonLd = generateCalculatorJsonLd(
  `UV / Blue Light Hazard',
  description: 'Calculates weighted hazard using the blue light B() and UV S() action spectra per IEC 62471 / ICNIRP guidelines.',
};


const jsonLd = generateCalculatorJsonLd(
  'UV / Blue Light Hazard',
  'Calculates weighted hazard using the blue light B() and UV S() action spectra per IEC 62471 / ICNIRP guidelines.',
  'https://photonics-calculators.vercel.app/laser-safety/uv-blue-hazard',
  { category: 'Laser Safety`,
  `Calculates weighted hazard using the blue light B() and UV S() action spectra per IEC 62471 / ICNIRP guidelines.',
};


const jsonLd = generateCalculatorJsonLd(
  'UV / Blue Light Hazard',
  'Calculates weighted hazard using the blue light B() and UV S() action spectra per IEC 62471 / ICNIRP guidelines.',
  'https://photonics-calculators.vercel.app/laser-safety/uv-blue-hazard',
  { category: 'Laser Safety`,
  `https://photonics-calculators.vercel.app/laser-safety/uv-blue-hazard`,
  { category: `Laser Safety` }
);
export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}
