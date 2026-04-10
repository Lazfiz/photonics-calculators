import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/fiber-optics/fiber-bragg-grating-sensor' },
    title: 'Fiber Bragg Grating Sensor Calculator',
    description: 'Calculate FBG wavelength shift for strain and temperature sensing applications.'
};

const jsonLd = generateCalculatorJsonLd(
  'Fiber Bragg Grating Sensor Calculator',
  'Calculate FBG wavelength shift for strain and temperature sensing applications.',
  'https://photonics-calculators.vercel.app/fiber-optics/fiber-bragg-grating-sensor',
  { category: 'Fiber Optics' }
);

export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}
