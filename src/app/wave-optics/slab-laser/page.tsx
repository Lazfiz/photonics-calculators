import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/wave-optics/slab-laser' },
    title: 'Zigzag Slab Laser',
  description: 'Bounce angle, temperature rise, optical path difference per bounce and slope efficiency of a zigzag slab laser from slab geometry and thermal load.'
};

const jsonLd = generateCalculatorJsonLd(
  'Zigzag Slab Laser',
  'Bounce angle, temperature rise, optical path difference per bounce and slope efficiency of a zigzag slab laser from slab geometry and thermal load.',
  'https://photonics-calculators.vercel.app/wave-optics/slab-laser',
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
