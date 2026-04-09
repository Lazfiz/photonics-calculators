import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/fiber-optics/side-polished' },
    title: 'Side-Polished Fiber',
  description: 'Evanescent field interaction, phase matching, and spectral response of side-polished fiber devices.'
};
const jsonLd = generateCalculatorJsonLd(
  `Side-Polished Fiber',
  description: 'Evanescent field interaction, phase matching, and spectral response of side-polished fiber devices.'
};


const jsonLd = generateCalculatorJsonLd(
  'Side-Polished Fiber',
  'Evanescent field interaction, phase matching, and spectral response of side-polished fiber devices.',
  'https://photonics-calculators.vercel.app/fiber-optics/side-polished',
  { category: 'Fiber Optics`,
  `Evanescent field interaction, phase matching, and spectral response of side-polished fiber devices.'
};


const jsonLd = generateCalculatorJsonLd(
  'Side-Polished Fiber',
  'Evanescent field interaction, phase matching, and spectral response of side-polished fiber devices.',
  'https://photonics-calculators.vercel.app/fiber-optics/side-polished',
  { category: 'Fiber Optics`,
  `https://photonics-calculators.vercel.app/fiber-optics/side-polished`,
  { category: `Fiber Optics` }
);
export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}
