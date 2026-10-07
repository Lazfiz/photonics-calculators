import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/wave-optics/diode-laser-resonator' },
    title: 'Diode Laser Resonator',
  description: 'Threshold gain and current, differential efficiency and far-field divergence of a Fabry–Pérot diode laser from cavity length and facet reflectivity.'
};

const jsonLd = generateCalculatorJsonLd(
  'Diode Laser Resonator',
  'Threshold gain and current, differential efficiency and far-field divergence of a Fabry–Pérot diode laser from cavity length and facet reflectivity.',
  'https://photonics-calculators.vercel.app/wave-optics/diode-laser-resonator',
  { category: 'Wave Optics' }
);

export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}
