import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/wave-optics/gouy-phase' },
    title: 'Gouy Phase Shift',
  description: 'Gouy phase ψ(z) = arctan(z/zᵣ) accumulated by Gaussian beam. Total phase shift through focus.'
};
const jsonLd = generateCalculatorJsonLd(
  `Gouy Phase Shift',
  description: 'Gouy phase ψ(z) = arctan(z/zᵣ) accumulated by Gaussian beam. Total phase shift through focus.'
};


const jsonLd = generateCalculatorJsonLd(
  'Gouy Phase Shift',
  'Gouy phase ψ(z) = arctan(z/zᵣ) accumulated by Gaussian beam. Total phase shift through focus.',
  'https://photonics-calculators.vercel.app/wave-optics/gouy-phase',
  { category: 'Wave Optics`,
  `Gouy phase ψ(z) = arctan(z/zᵣ) accumulated by Gaussian beam. Total phase shift through focus.'
};


const jsonLd = generateCalculatorJsonLd(
  'Gouy Phase Shift',
  'Gouy phase ψ(z) = arctan(z/zᵣ) accumulated by Gaussian beam. Total phase shift through focus.',
  'https://photonics-calculators.vercel.app/wave-optics/gouy-phase',
  { category: 'Wave Optics`,
  `https://photonics-calculators.vercel.app/wave-optics/gouy-phase`,
  { category: `Wave Optics` }
);
export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}
