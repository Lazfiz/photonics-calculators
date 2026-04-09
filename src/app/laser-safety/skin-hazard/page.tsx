import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/laser-safety/skin-hazard' },
    title: 'Skin Hazard Assessment',
  description: 'Evaluate skin exposure risk from laser irradiation per ANSI Z136.1 simplified skin MPE.'
};
const jsonLd = generateCalculatorJsonLd(
  `Skin Hazard Assessment',
  description: 'Evaluate skin exposure risk from laser irradiation per ANSI Z136.1 simplified skin MPE.'
};


const jsonLd = generateCalculatorJsonLd(
  'Skin Hazard Assessment',
  'Evaluate skin exposure risk from laser irradiation per ANSI Z136.1 simplified skin MPE.',
  'https://photonics-calculators.vercel.app/laser-safety/skin-hazard',
  { category: 'Laser Safety`,
  `Evaluate skin exposure risk from laser irradiation per ANSI Z136.1 simplified skin MPE.'
};


const jsonLd = generateCalculatorJsonLd(
  'Skin Hazard Assessment',
  'Evaluate skin exposure risk from laser irradiation per ANSI Z136.1 simplified skin MPE.',
  'https://photonics-calculators.vercel.app/laser-safety/skin-hazard',
  { category: 'Laser Safety`,
  `https://photonics-calculators.vercel.app/laser-safety/skin-hazard`,
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
