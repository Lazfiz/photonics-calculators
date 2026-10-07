import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/fiber-optics/polarization-controller' },
    title: 'Fiber Polarization Controller',
  description: 'Retardation per paddle, bend-induced birefringence, quarter- and half-wave coil lengths and output polarization state of a fiber polarization controller.'
};

const jsonLd = generateCalculatorJsonLd(
  'Fiber Polarization Controller',
  'Retardation per paddle, bend-induced birefringence, quarter- and half-wave coil lengths and output polarization state of a fiber polarization controller.',
  'https://photonics-calculators.vercel.app/fiber-optics/polarization-controller',
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
