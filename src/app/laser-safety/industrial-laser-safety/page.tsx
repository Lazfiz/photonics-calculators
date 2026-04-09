import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/laser-safety/industrial-laser-safety' },
    title: 'Industrial Laser Safety Calculator',
  description: 'Assess direct beam, specular/diffuse reflections, NOHD, and OD for industrial cutting/welding lasers.'
};
const jsonLd = generateCalculatorJsonLd(
  `Industrial Laser Safety Calculator',
  description: 'Assess direct beam, specular/diffuse reflections, NOHD, and OD for industrial cutting/welding lasers.'
};


const jsonLd = generateCalculatorJsonLd(
  'Industrial Laser Safety Calculator',
  'Assess direct beam, specular/diffuse reflections, NOHD, and OD for industrial cutting/welding lasers.',
  'https://photonics-calculators.vercel.app/laser-safety/industrial-laser-safety',
  { category: 'Laser Safety`,
  `Assess direct beam, specular/diffuse reflections, NOHD, and OD for industrial cutting/welding lasers.'
};


const jsonLd = generateCalculatorJsonLd(
  'Industrial Laser Safety Calculator',
  'Assess direct beam, specular/diffuse reflections, NOHD, and OD for industrial cutting/welding lasers.',
  'https://photonics-calculators.vercel.app/laser-safety/industrial-laser-safety',
  { category: 'Laser Safety`,
  `https://photonics-calculators.vercel.app/laser-safety/industrial-laser-safety`,
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
