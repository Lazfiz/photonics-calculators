import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/thin-film/metal-dielectric' },
    title: 'Metal-Dielectric Coatings',
  description: 'Metal-dielectric coating design. Explore how a dielectric overcoat modifies the reflectance, transmittance, and absorptance of a thin metal layer.'
};
const jsonLd = generateCalculatorJsonLd(
  `Metal-Dielectric Coatings',
  description: 'Metal-dielectric coating design. Explore how a dielectric overcoat modifies the reflectance, transmittance, and absorptance of a thin metal layer.'
};


const jsonLd = generateCalculatorJsonLd(
  'Metal-Dielectric Coatings',
  'Metal-dielectric coating design. Explore how a dielectric overcoat modifies the reflectance, transmittance, and absorptance of a thin metal layer.',
  'https://photonics-calculators.vercel.app/thin-film/metal-dielectric',
  { category: 'Thin Film`,
  `Metal-dielectric coating design. Explore how a dielectric overcoat modifies the reflectance, transmittance, and absorptance of a thin metal layer.'
};


const jsonLd = generateCalculatorJsonLd(
  'Metal-Dielectric Coatings',
  'Metal-dielectric coating design. Explore how a dielectric overcoat modifies the reflectance, transmittance, and absorptance of a thin metal layer.',
  'https://photonics-calculators.vercel.app/thin-film/metal-dielectric',
  { category: 'Thin Film`,
  `https://photonics-calculators.vercel.app/thin-film/metal-dielectric`,
  { category: `Thin Film` }
);
export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}
