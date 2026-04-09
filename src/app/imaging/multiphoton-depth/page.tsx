import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/imaging/multiphoton-depth' },
    title: 'Multiphoton Imaging Depth Calculator',
  description: 'Two-photon excitation depth penetration, resolution, and laser parameters.'
};
const jsonLd = generateCalculatorJsonLd(
  `Multiphoton Imaging Depth Calculator',
  description: 'Two-photon excitation depth penetration, resolution, and laser parameters.'
};


const jsonLd = generateCalculatorJsonLd(
  'Multiphoton Imaging Depth Calculator',
  'Two-photon excitation depth penetration, resolution, and laser parameters.',
  'https://photonics-calculators.vercel.app/imaging/multiphoton-depth',
  { category: 'Imaging`,
  `Two-photon excitation depth penetration, resolution, and laser parameters.'
};


const jsonLd = generateCalculatorJsonLd(
  'Multiphoton Imaging Depth Calculator',
  'Two-photon excitation depth penetration, resolution, and laser parameters.',
  'https://photonics-calculators.vercel.app/imaging/multiphoton-depth',
  { category: 'Imaging`,
  `https://photonics-calculators.vercel.app/imaging/multiphoton-depth`,
  { category: `Imaging` }
);
export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}
