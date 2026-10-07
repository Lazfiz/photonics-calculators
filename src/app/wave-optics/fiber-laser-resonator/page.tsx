import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/wave-optics/fiber-laser-resonator' },
    title: 'Fiber Laser Resonator',
  description: 'V-number, mode field diameter, threshold gain and slope efficiency of a fiber laser cavity from fiber length, core, NA and mirror reflectivities.'
};

const jsonLd = generateCalculatorJsonLd(
  'Fiber Laser Resonator',
  'V-number, mode field diameter, threshold gain and slope efficiency of a fiber laser cavity from fiber length, core, NA and mirror reflectivities.',
  'https://photonics-calculators.vercel.app/wave-optics/fiber-laser-resonator',
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
