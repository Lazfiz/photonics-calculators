import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/materials/fresnel' },
    title: 'Fresnel Equations',
  description: 'Interactive Fresnel reflection and transmission at a dielectric interface with sliders, presets, and angle sweeps.'
};
const jsonLd = generateCalculatorJsonLd(
  `Fresnel Equations',
  description: 'Interactive Fresnel reflection and transmission at a dielectric interface with sliders, presets, and angle sweeps.'
};


const jsonLd = generateCalculatorJsonLd(
  'Fresnel Equations',
  'Interactive Fresnel reflection and transmission at a dielectric interface with sliders, presets, and angle sweeps.',
  'https://photonics-calculators.vercel.app/materials/fresnel',
  { category: 'Materials`,
  `Interactive Fresnel reflection and transmission at a dielectric interface with sliders, presets, and angle sweeps.'
};


const jsonLd = generateCalculatorJsonLd(
  'Fresnel Equations',
  'Interactive Fresnel reflection and transmission at a dielectric interface with sliders, presets, and angle sweeps.',
  'https://photonics-calculators.vercel.app/materials/fresnel',
  { category: 'Materials`,
  `https://photonics-calculators.vercel.app/materials/fresnel`,
  { category: `Materials` }
);
export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}
