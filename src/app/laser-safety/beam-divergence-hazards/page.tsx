import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/laser-safety/beam-divergence-hazards' },
    title: 'Beam Divergence Hazards',
  description: 'Model Gaussian beam propagation and hazard distance based on beam divergence and MPE limits.'
};
const jsonLd = generateCalculatorJsonLd(
  `Beam Divergence Hazards',
  description: 'Model Gaussian beam propagation and hazard distance based on beam divergence and MPE limits.'
};


const jsonLd = generateCalculatorJsonLd(
  'Beam Divergence Hazards',
  'Model Gaussian beam propagation and hazard distance based on beam divergence and MPE limits.',
  'https://photonics-calculators.vercel.app/laser-safety/beam-divergence-hazards',
  { category: 'Laser Safety`,
  `Model Gaussian beam propagation and hazard distance based on beam divergence and MPE limits.'
};


const jsonLd = generateCalculatorJsonLd(
  'Beam Divergence Hazards',
  'Model Gaussian beam propagation and hazard distance based on beam divergence and MPE limits.',
  'https://photonics-calculators.vercel.app/laser-safety/beam-divergence-hazards',
  { category: 'Laser Safety`,
  `https://photonics-calculators.vercel.app/laser-safety/beam-divergence-hazards`,
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
