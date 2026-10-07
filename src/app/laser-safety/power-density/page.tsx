import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/laser-safety/power-density' },
    title: 'Power Density Calculator',
  description: 'Peak and average irradiance of a Gaussian beam from power and 1/e² diameter, with the beam area and the radial intensity profile.'
};

const jsonLd = generateCalculatorJsonLd(
  'Power Density Calculator',
  'Peak and average irradiance of a Gaussian beam from power and 1/e² diameter, with the beam area and the radial intensity profile.',
  'https://photonics-calculators.vercel.app/laser-safety/power-density',
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
