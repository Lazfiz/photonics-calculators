import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/wave-optics/cavity-dumped' },
    title: 'Cavity-Dumped Laser',
  description: 'Energy extraction from a laser cavity using fast Q-switching or intracavity modulation.'
};
const jsonLd = generateCalculatorJsonLd(
  `Cavity-Dumped Laser',
  description: 'Energy extraction from a laser cavity using fast Q-switching or intracavity modulation.'
};


const jsonLd = generateCalculatorJsonLd(
  'Cavity-Dumped Laser',
  'Energy extraction from a laser cavity using fast Q-switching or intracavity modulation.',
  'https://photonics-calculators.vercel.app/wave-optics/cavity-dumped',
  { category: 'Wave Optics`,
  `Energy extraction from a laser cavity using fast Q-switching or intracavity modulation.'
};


const jsonLd = generateCalculatorJsonLd(
  'Cavity-Dumped Laser',
  'Energy extraction from a laser cavity using fast Q-switching or intracavity modulation.',
  'https://photonics-calculators.vercel.app/wave-optics/cavity-dumped',
  { category: 'Wave Optics`,
  `https://photonics-calculators.vercel.app/wave-optics/cavity-dumped`,
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
