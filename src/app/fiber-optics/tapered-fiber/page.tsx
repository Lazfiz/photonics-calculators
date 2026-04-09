import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/fiber-optics/tapered-fiber' },
    title: 'Tapered Fiber Design',
  description: 'Design adiabatic fiber tapers for mode conversion, evanescent field enhancement, and coupler fabrication.'
};
const jsonLd = generateCalculatorJsonLd(
  `Tapered Fiber Design',
  description: 'Design adiabatic fiber tapers for mode conversion, evanescent field enhancement, and coupler fabrication.'
};


const jsonLd = generateCalculatorJsonLd(
  'Tapered Fiber Design',
  'Design adiabatic fiber tapers for mode conversion, evanescent field enhancement, and coupler fabrication.',
  'https://photonics-calculators.vercel.app/fiber-optics/tapered-fiber',
  { category: 'Fiber Optics`,
  `Design adiabatic fiber tapers for mode conversion, evanescent field enhancement, and coupler fabrication.'
};


const jsonLd = generateCalculatorJsonLd(
  'Tapered Fiber Design',
  'Design adiabatic fiber tapers for mode conversion, evanescent field enhancement, and coupler fabrication.',
  'https://photonics-calculators.vercel.app/fiber-optics/tapered-fiber',
  { category: 'Fiber Optics`,
  `https://photonics-calculators.vercel.app/fiber-optics/tapered-fiber`,
  { category: `Fiber Optics` }
);
export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}
