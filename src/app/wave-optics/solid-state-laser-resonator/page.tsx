import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/wave-optics/solid-state-laser-resonator' },
    title: 'Solid State Laser Resonator',
  description: 'Two-mirror resonator stability g₁g₂, beam waist and radius along the cavity, and slope efficiency and output power of a solid-state laser.'
};

const jsonLd = generateCalculatorJsonLd(
  'Solid State Laser Resonator',
  'Two-mirror resonator stability g₁g₂, beam waist and radius along the cavity, and slope efficiency and output power of a solid-state laser.',
  'https://photonics-calculators.vercel.app/wave-optics/solid-state-laser-resonator',
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
