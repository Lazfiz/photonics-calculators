import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/laser-safety/thermal-vs-photochemical' },
    title: 'Thermal vs Photochemical MPE',
  description: 'Educational comparison of thermal and photochemical retinal MPE versus wavelength and exposure time, showing which mechanism sets the limit.'
};

const jsonLd = generateCalculatorJsonLd(
  'Thermal vs Photochemical MPE',
  'Educational comparison of thermal and photochemical retinal MPE versus wavelength and exposure time, showing which mechanism sets the limit.',
  'https://photonics-calculators.vercel.app/laser-safety/thermal-vs-photochemical',
  { category: 'Laser Safety' }
);

export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}
