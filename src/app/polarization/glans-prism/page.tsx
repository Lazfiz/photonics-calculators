import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/polarization/glans-prism' },
    title: 'Glan Prism Polarizer Design',
  description: 'Compare Glan-Taylor (air gap) and Glan-Thompson (cemented) polarizer designs based on calcite or other birefringent crystals.'
};
const jsonLd = generateCalculatorJsonLd(
  `Glan Prism Polarizer Design',
  description: 'Compare Glan-Taylor (air gap) and Glan-Thompson (cemented) polarizer designs based on calcite or other birefringent crystals.'
};


const jsonLd = generateCalculatorJsonLd(
  'Glan Prism Polarizer Design',
  'Compare Glan-Taylor (air gap) and Glan-Thompson (cemented) polarizer designs based on calcite or other birefringent crystals.',
  'https://photonics-calculators.vercel.app/polarization/glans-prism',
  { category: 'Polarization`,
  `Compare Glan-Taylor (air gap) and Glan-Thompson (cemented) polarizer designs based on calcite or other birefringent crystals.'
};


const jsonLd = generateCalculatorJsonLd(
  'Glan Prism Polarizer Design',
  'Compare Glan-Taylor (air gap) and Glan-Thompson (cemented) polarizer designs based on calcite or other birefringent crystals.',
  'https://photonics-calculators.vercel.app/polarization/glans-prism',
  { category: 'Polarization`,
  `https://photonics-calculators.vercel.app/polarization/glans-prism`,
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
