import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/thin-film/notch-filter' },
    title: 'Notch Filter',
  description: 'Rejection notch filter — high reflectance at target wavelength, transmits elsewhere.'
};
const jsonLd = generateCalculatorJsonLd(
  `Notch Filter',
  description: 'Rejection notch filter — high reflectance at target wavelength, transmits elsewhere.'
};


const jsonLd = generateCalculatorJsonLd(
  'Notch Filter',
  'Rejection notch filter — high reflectance at target wavelength, transmits elsewhere.',
  'https://photonics-calculators.vercel.app/thin-film/notch-filter',
  { category: 'Thin Film`,
  `Rejection notch filter — high reflectance at target wavelength, transmits elsewhere.'
};


const jsonLd = generateCalculatorJsonLd(
  'Notch Filter',
  'Rejection notch filter — high reflectance at target wavelength, transmits elsewhere.',
  'https://photonics-calculators.vercel.app/thin-film/notch-filter',
  { category: 'Thin Film`,
  `https://photonics-calculators.vercel.app/thin-film/notch-filter`,
  { category: `Thin Film` }
);
export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}
