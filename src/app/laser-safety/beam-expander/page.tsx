import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/laser-safety/beam-expander' },
    title: 'Beam Expander Safety',
  description: 'Calculate power density reduction from beam expansion. Critical for ensuring safe irradiance levels.'
};
const jsonLd = generateCalculatorJsonLd(
  `Beam Expander Safety',
  description: 'Calculate power density reduction from beam expansion. Critical for ensuring safe irradiance levels.'
};


const jsonLd = generateCalculatorJsonLd(
  'Beam Expander Safety',
  'Calculate power density reduction from beam expansion. Critical for ensuring safe irradiance levels.',
  'https://photonics-calculators.vercel.app/laser-safety/beam-expander',
  { category: 'Laser Safety`,
  `Calculate power density reduction from beam expansion. Critical for ensuring safe irradiance levels.'
};


const jsonLd = generateCalculatorJsonLd(
  'Beam Expander Safety',
  'Calculate power density reduction from beam expansion. Critical for ensuring safe irradiance levels.',
  'https://photonics-calculators.vercel.app/laser-safety/beam-expander',
  { category: 'Laser Safety`,
  `https://photonics-calculators.vercel.app/laser-safety/beam-expander`,
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
