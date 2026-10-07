import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/fiber-optics/fiber-laser' },
    title: 'Fiber Laser Output Power',
  description: 'Fiber laser output power, optical, Stokes and quantum efficiency, and output-coupler and cavity losses from pump power, wavelengths and slope efficiency.'
};

const jsonLd = generateCalculatorJsonLd(
  'Fiber Laser Output Power',
  'Fiber laser output power, optical, Stokes and quantum efficiency, and output-coupler and cavity losses from pump power, wavelengths and slope efficiency.',
  'https://photonics-calculators.vercel.app/fiber-optics/fiber-laser',
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
