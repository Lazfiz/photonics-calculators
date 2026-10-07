import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/wave-optics/gas-laser-resonator' },
    title: 'Gas Laser Resonator',
  description: 'Stability g₁g₂, beam waist, Fresnel number, optimal output coupling and output power of a HeNe or CO₂ laser from tube size and mirror radii.'
};

const jsonLd = generateCalculatorJsonLd(
  'Gas Laser Resonator',
  'Stability g₁g₂, beam waist, Fresnel number, optimal output coupling and output power of a HeNe or CO₂ laser from tube size and mirror radii.',
  'https://photonics-calculators.vercel.app/wave-optics/gas-laser-resonator',
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
