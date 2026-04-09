import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/polarization/wire-grid' },
    title: 'Wire Grid Polarizer Calculator',
  description: 'Model wire grid polarizers — metallic wires on a substrate that reflect E∥ and transmit E⊥.',
};
const jsonLd = generateCalculatorJsonLd(
  `Wire Grid Polarizer Calculator',
  description: 'Model wire grid polarizers — metallic wires on a substrate that reflect E∥ and transmit E⊥.',
};


const jsonLd = generateCalculatorJsonLd(
  'Wire Grid Polarizer Calculator',
  'Model wire grid polarizers — metallic wires on a substrate that reflect E∥ and transmit E⊥.',
  'https://photonics-calculators.vercel.app/polarization/wire-grid',
  { category: 'Polarization`,
  `Model wire grid polarizers — metallic wires on a substrate that reflect E∥ and transmit E⊥.',
};


const jsonLd = generateCalculatorJsonLd(
  'Wire Grid Polarizer Calculator',
  'Model wire grid polarizers — metallic wires on a substrate that reflect E∥ and transmit E⊥.',
  'https://photonics-calculators.vercel.app/polarization/wire-grid',
  { category: 'Polarization`,
  `https://photonics-calculators.vercel.app/polarization/wire-grid`,
  { category: `Polarization` }
);
export default function Page() {
  return (
    <>
      <JsonLdScript data={jsonLd} />
      <PageClient />
    </>
  );
}
