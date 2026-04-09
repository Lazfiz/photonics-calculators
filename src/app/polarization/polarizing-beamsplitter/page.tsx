import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/polarization/polarizing-beamsplitter' },
    title: 'Polarizing Beamsplitter (PBS) Design',
  description: 'Design polarizing beamsplitter cubes and prisms based on birefringent crystals with air-gap TIR separation.'
};
const jsonLd = generateCalculatorJsonLd(
  `Polarizing Beamsplitter (PBS) Design',
  description: 'Design polarizing beamsplitter cubes and prisms based on birefringent crystals with air-gap TIR separation.'
};


const jsonLd = generateCalculatorJsonLd(
  'Polarizing Beamsplitter (PBS) Design',
  'Design polarizing beamsplitter cubes and prisms based on birefringent crystals with air-gap TIR separation.',
  'https://photonics-calculators.vercel.app/polarization/polarizing-beamsplitter',
  { category: 'Polarization`,
  `Design polarizing beamsplitter cubes and prisms based on birefringent crystals with air-gap TIR separation.'
};


const jsonLd = generateCalculatorJsonLd(
  'Polarizing Beamsplitter (PBS) Design',
  'Design polarizing beamsplitter cubes and prisms based on birefringent crystals with air-gap TIR separation.',
  'https://photonics-calculators.vercel.app/polarization/polarizing-beamsplitter',
  { category: 'Polarization`,
  `https://photonics-calculators.vercel.app/polarization/polarizing-beamsplitter`,
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
