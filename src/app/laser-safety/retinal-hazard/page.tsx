import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/laser-safety/retinal-hazard' },
    title: 'Retinal Hazard Calculator',
  description: 'Estimate retinal irradiance and image size from corneal laser parameters. Simplified model assuming emmetropic eye.'
};
const jsonLd = generateCalculatorJsonLd(
  `Retinal Hazard Calculator',
  description: 'Estimate retinal irradiance and image size from corneal laser parameters. Simplified model assuming emmetropic eye.'
};


const jsonLd = generateCalculatorJsonLd(
  'Retinal Hazard Calculator',
  'Estimate retinal irradiance and image size from corneal laser parameters. Simplified model assuming emmetropic eye.',
  'https://photonics-calculators.vercel.app/laser-safety/retinal-hazard',
  { category: 'Laser Safety`,
  `Estimate retinal irradiance and image size from corneal laser parameters. Simplified model assuming emmetropic eye.'
};


const jsonLd = generateCalculatorJsonLd(
  'Retinal Hazard Calculator',
  'Estimate retinal irradiance and image size from corneal laser parameters. Simplified model assuming emmetropic eye.',
  'https://photonics-calculators.vercel.app/laser-safety/retinal-hazard',
  { category: 'Laser Safety`,
  `https://photonics-calculators.vercel.app/laser-safety/retinal-hazard`,
  { category: `Laser Safety` }
);
export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}
