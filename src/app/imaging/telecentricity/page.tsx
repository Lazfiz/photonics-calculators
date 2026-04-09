import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/imaging/telecentricity' },
    title: 'Telecentric Lens Design',
  description: 'Telecentric lenses maintain constant magnification regardless of object distance. Chief rays are parallel to optical axis.'
};
const jsonLd = generateCalculatorJsonLd(
  `Telecentric Lens Design',
  description: 'Telecentric lenses maintain constant magnification regardless of object distance. Chief rays are parallel to optical axis.'
};


const jsonLd = generateCalculatorJsonLd(
  'Telecentric Lens Design',
  'Telecentric lenses maintain constant magnification regardless of object distance. Chief rays are parallel to optical axis.',
  'https://photonics-calculators.vercel.app/imaging/telecentricity',
  { category: 'Imaging`,
  `Telecentric lenses maintain constant magnification regardless of object distance. Chief rays are parallel to optical axis.'
};


const jsonLd = generateCalculatorJsonLd(
  'Telecentric Lens Design',
  'Telecentric lenses maintain constant magnification regardless of object distance. Chief rays are parallel to optical axis.',
  'https://photonics-calculators.vercel.app/imaging/telecentricity',
  { category: 'Imaging`,
  `https://photonics-calculators.vercel.app/imaging/telecentricity`,
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
