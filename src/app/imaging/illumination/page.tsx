import type { Metadata } from "next";
import { generateCalculatorJsonLd, JsonLdScript } from '../../../lib/json-ld';
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/imaging/illumination' },
    title: 'Köhler Illumination Calculator',
  description: 'Design parameters for Köhler illumination including conjugate planes, fill factor, and field of view.'
};
const jsonLd = generateCalculatorJsonLd(
  `Köhler Illumination Calculator',
  description: 'Design parameters for Köhler illumination including conjugate planes, fill factor, and field of view.'
};


const jsonLd = generateCalculatorJsonLd(
  'Köhler Illumination Calculator',
  'Design parameters for Köhler illumination including conjugate planes, fill factor, and field of view.',
  'https://photonics-calculators.vercel.app/imaging/illumination',
  { category: 'Imaging`,
  `Design parameters for Köhler illumination including conjugate planes, fill factor, and field of view.'
};


const jsonLd = generateCalculatorJsonLd(
  'Köhler Illumination Calculator',
  'Design parameters for Köhler illumination including conjugate planes, fill factor, and field of view.',
  'https://photonics-calculators.vercel.app/imaging/illumination',
  { category: 'Imaging`,
  `https://photonics-calculators.vercel.app/imaging/illumination`,
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
