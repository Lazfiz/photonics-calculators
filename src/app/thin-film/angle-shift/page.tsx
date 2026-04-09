import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/thin-film/angle-shift' },
    title: 'Angle-Dependent Blue Shift',
  description: 'How the effective design wavelength shifts with angle of incidence (blue shift).',
};
const jsonLd = generateCalculatorJsonLd(
  `Angle-Dependent Blue Shift',
  description: 'How the effective design wavelength shifts with angle of incidence (blue shift).',
};


const jsonLd = generateCalculatorJsonLd(
  'Angle-Dependent Blue Shift',
  'How the effective design wavelength shifts with angle of incidence (blue shift).',
  'https://photonics-calculators.vercel.app/thin-film/angle-shift',
  { category: 'Thin Film`,
  `How the effective design wavelength shifts with angle of incidence (blue shift).',
};


const jsonLd = generateCalculatorJsonLd(
  'Angle-Dependent Blue Shift',
  'How the effective design wavelength shifts with angle of incidence (blue shift).',
  'https://photonics-calculators.vercel.app/thin-film/angle-shift',
  { category: 'Thin Film`,
  `https://photonics-calculators.vercel.app/thin-film/angle-shift`,
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
