import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/fiber-optics/mode-field-diameter' },
    title: 'Mode Field Diameter',
  description: 'Calculate MFD, effective area, and spot size for single-mode fibers.'
};
const jsonLd = generateCalculatorJsonLd(
  `Mode Field Diameter',
  description: 'Calculate MFD, effective area, and spot size for single-mode fibers.'
};


const jsonLd = generateCalculatorJsonLd(
  'Mode Field Diameter',
  'Calculate MFD, effective area, and spot size for single-mode fibers.',
  'https://photonics-calculators.vercel.app/fiber-optics/mode-field-diameter',
  { category: 'Fiber Optics`,
  `Calculate MFD, effective area, and spot size for single-mode fibers.'
};


const jsonLd = generateCalculatorJsonLd(
  'Mode Field Diameter',
  'Calculate MFD, effective area, and spot size for single-mode fibers.',
  'https://photonics-calculators.vercel.app/fiber-optics/mode-field-diameter',
  { category: 'Fiber Optics`,
  `https://photonics-calculators.vercel.app/fiber-optics/mode-field-diameter`,
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
