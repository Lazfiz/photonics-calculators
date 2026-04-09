import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/laser-safety/diffuse-reflection' },
    title: 'Diffuse Reflection Hazard',
  description: 'Evaluate hazard from Lambertian (diffuse) reflections off matte surfaces. Uses extended-source MPE.'
};
const jsonLd = generateCalculatorJsonLd(
  `Diffuse Reflection Hazard',
  description: 'Evaluate hazard from Lambertian (diffuse) reflections off matte surfaces. Uses extended-source MPE.'
};


const jsonLd = generateCalculatorJsonLd(
  'Diffuse Reflection Hazard',
  'Evaluate hazard from Lambertian (diffuse) reflections off matte surfaces. Uses extended-source MPE.',
  'https://photonics-calculators.vercel.app/laser-safety/diffuse-reflection',
  { category: 'Laser Safety`,
  `Evaluate hazard from Lambertian (diffuse) reflections off matte surfaces. Uses extended-source MPE.'
};


const jsonLd = generateCalculatorJsonLd(
  'Diffuse Reflection Hazard',
  'Evaluate hazard from Lambertian (diffuse) reflections off matte surfaces. Uses extended-source MPE.',
  'https://photonics-calculators.vercel.app/laser-safety/diffuse-reflection',
  { category: 'Laser Safety`,
  `https://photonics-calculators.vercel.app/laser-safety/diffuse-reflection`,
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
